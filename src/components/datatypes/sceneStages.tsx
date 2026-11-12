"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { LOOKS } from "@/components/level-one/TeacherFlow";
import { BounceIn } from "@/components/level-two/BounceIn";
import { HexBubble } from "@/components/level-two/HexBubble";
import { playClickSound } from "@/components/onboarding/clickSound";
import { EDGE, RAISED } from "@/components/ui/raised";
import { vibrateForTap } from "@/lib/haptics";
import type { SceneValues } from "@/lib/rive/datatypesHost";
import { SHAKE, WRONG_MS } from "./interactions";
import { CARD_BODY_FLAT, CARD_TEXT, EDGE_IDLE, EDGE_READING, TINTS, tintAt, type GroupTint } from "./look";
import type { InteractionApi } from "./screen";
import { Pic } from "./visuals";

/**
 * The controls that stand under a scene (see `DATATYPES_SCENES`). The scene draws the picture and takes no taps,
 * so these are the learner's hands: each choice is written into the scene (`InteractionApi.setScene`) and the
 * scene shows it (a card flies to its bin, a value lights up). They are small: only about 215px of the stage is
 * free under a scene on a phone.
 */
const STAGE_W = "w-[354px]";
const NOTE = "min-h-5 text-center text-[13px] leading-5 font-medium text-[#D42421]";
const PROMPT = "text-[#6B7480] dark:text-white/60";

/** Hands `values` to the scene, and takes them back when the stage goes. */
const useSceneValues = (api: InteractionApi, values: SceneValues) => {
  const { setScene } = api;
  const key = JSON.stringify(values);
  useEffect(() => {
    setScene?.(JSON.parse(key) as SceneValues);
  }, [setScene, key]);
};

/** The look of a button that has been got right, got wrong, or is waiting. */
const buttonLook = (state: "right" | "wrong" | "idle", index: number) =>
  state === "right" ? `${LOOKS.correct.card} ${LOOKS.correct.edge}` : state === "wrong" ? `${LOOKS.wrong.card} ${LOOKS.wrong.edge}` : `${tintAt(index)} ${EDGE_IDLE} ${EDGE.khaki}`;

/** Runs `done` a moment after `ready` turns on (so the last change is seen first). */
const useFinishWhen = (ready: boolean, done: () => void, delay = 500) => {
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(done, delay);
    return () => window.clearTimeout(timer);
  }, [ready, done, delay]);
};

export type SceneSortItem = {
  id: string;
  label: string;
  sub?: string;
  /** The scene's value for this card (`card1`, `p3`, ...). */
  key: string;
  /** The group it belongs to. Left out where any group will do (screen 3 has no right answer). */
  bucket?: string;
  /** What is said when it is put in the wrong group. */
  hint?: string;
  /** What `key` is set to when it is in a group, if not the group's own `value`. */
  value?: number;
};
export type SceneSortBucket = {
  id: string;
  label: string;
  icon?: string;
  /** What a card's `key` is set to when it is in this group. */
  value: number;
};

/**
 * Sorting, one card at a time: the card to place stands up, and the learner taps the group it belongs to. A right
 * group sends the card there in the scene; a wrong one shakes red with a hint (and counts as a slip). It is done
 * when every card is in a group. With no `bucket` on the cards any group is right, and `onSorted` hears how they
 * were grouped.
 */
export function SceneSortStage({
  api,
  items,
  buckets,
  prompt = "Tap the group it belongs to.",
  base,
  doneValues,
  slipValues,
  onSorted,
}: {
  api: InteractionApi;
  items: readonly SceneSortItem[];
  buckets: readonly SceneSortBucket[];
  prompt?: string;
  /** More for the scene, from where the cards are (card id to group id): a total once both prices are in. */
  base?: (placed: Readonly<Record<string, string>>) => SceneValues;
  /** More for the scene once it is done. */
  doneValues?: SceneValues;
  /** What the scene shows after a card went in the wrong group (the magnifier on a number). */
  slipValues?: (item: SceneSortItem) => SceneValues;
  onSorted?: (placed: Readonly<Record<string, string>>) => void;
}) {
  const { slip, done, finished, hexSpoken } = api;
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [wrongBucket, setWrongBucket] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [peek, setPeek] = useState<SceneValues>({});
  const current = items.find((item) => !placed[item.id]);
  const all = !current;

  const values = useMemo(() => {
    const inGroups = Object.fromEntries(
      items.flatMap((item) => {
        const bucket = buckets.find((candidate) => candidate.id === placed[item.id]);
        return bucket ? [[item.key, item.value ?? bucket.value] as const] : [];
      }),
    );
    return { ...inGroups, ...base?.(placed), ...(finished ? doneValues : undefined), ...peek };
  }, [items, buckets, placed, base, doneValues, finished, peek]);
  useSceneValues(api, values);

  const sorted = useCallback(() => {
    onSorted?.(placed);
    done();
  }, [onSorted, placed, done]);
  useFinishWhen(all, sorted, 600);

  const choose = (bucket: SceneSortBucket) => {
    if (!current || finished) return;
    if (!current.bucket || current.bucket === bucket.id) {
      playClickSound();
      vibrateForTap();
      setNote("");
      setPeek({});
      setPlaced((now) => ({ ...now, [current.id]: bucket.id }));
      return;
    }
    slip();
    setNote(current.hint ?? "Not that group. Look again at what it is.");
    setPeek(slipValues?.(current) ?? {});
    setWrongBucket(bucket.id);
    window.setTimeout(() => setWrongBucket(null), WRONG_MS);
  };

  const columns = buckets.length >= 4 ? "grid-cols-4" : buckets.length === 3 ? "grid-cols-3" : "grid-cols-2";
  const stacked = buckets.length >= 4;
  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-3`}>
      <div className="flex h-[62px] items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.div
              key={current.id}
              initial={{ scale: 0.7, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0, x: wrongBucket ? SHAKE : 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              // The shake is a run of keyframes, which a spring can't do: it keeps its own timing.
              transition={{ type: "spring", stiffness: 420, damping: 26, x: { duration: 0.35 } }}
              className={`${CARD_BODY_FLAT} ${RAISED} ${TINTS.lavender} ${wrongBucket ? `${LOOKS.wrong.card} ${LOOKS.wrong.edge}` : `${EDGE_IDLE} ${EDGE.khaki}`} min-h-[58px] min-w-[160px] flex-col px-5 py-1`}
            >
              <span className={CARD_TEXT}>{current.label}</span>
              {current.sub && <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{current.sub}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`grid w-full gap-2.5 ${columns}`}>
        {buckets.map((bucket, index) => (
          <BounceIn key={bucket.id} index={index} shown={hexSpoken} className="flex min-w-0">
            <motion.button
              type="button"
              disabled={finished || all}
              onClick={() => choose(bucket)}
              animate={{ x: wrongBucket === bucket.id ? SHAKE : 0 }}
              transition={{ duration: 0.35 }}
              whileTap={{ scale: 0.97 }}
              className={`${CARD_BODY_FLAT} ${RAISED} min-w-0 flex-1 cursor-pointer gap-1.5 px-1 ${stacked ? "h-[68px] flex-col" : "h-[58px]"} ${buttonLook(wrongBucket === bucket.id ? "wrong" : "idle", index)}`}
            >
              {bucket.icon && <Pic src={bucket.icon} className={stacked ? "h-6 w-6" : "h-7 w-7"} />}
              <span className={`${stacked ? "text-[13px]" : "text-[15px]"} leading-[110%] font-semibold text-[#444444] dark:text-white`}>{bucket.label}</span>
            </motion.button>
          </BounceIn>
        ))}
      </div>

      <p className={NOTE}>{note || <span className={PROMPT}>{finished ? "" : prompt}</span>}</p>
    </div>
  );
}

export type ScenePickItem = {
  id: string;
  label: string;
  sub?: string;
  /** The scene's value that lights this one up. */
  key: string;
};

/**
 * Tap the values that fit: each right one lights up in the scene and its button turns green; a wrong one shakes red
 * with a hint (and counts as a slip). It is done when every right one has been tapped.
 */
export function ScenePickStage({
  api,
  items,
  correct,
  hint,
  columns = 2,
  doneValues,
}: {
  api: InteractionApi;
  items: readonly ScenePickItem[];
  /** The ids of the ones that fit. */
  correct: readonly string[];
  hint: string;
  columns?: 2 | 3;
  /** More for the scene once it is done (the ids tagged on the text screen). */
  doneValues?: SceneValues;
}) {
  const { slip, done, finished, hexSpoken } = api;
  const [got, setGot] = useState<readonly string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const values = useMemo(() => ({ ...Object.fromEntries(items.filter((item) => got.includes(item.id)).map((item) => [item.key, 1])), ...(finished ? doneValues : undefined) }), [items, got, doneValues, finished]);
  useSceneValues(api, values);
  useFinishWhen(got.length >= correct.length, done, 600);

  const tap = (id: string) => {
    if (finished || got.includes(id)) return;
    playClickSound();
    vibrateForTap();
    if (correct.includes(id)) {
      setNote("");
      setGot((now) => [...now, id]);
      return;
    }
    slip();
    setNote(hint);
    setWrongId(id);
    window.setTimeout(() => setWrongId(null), WRONG_MS);
  };

  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-2`}>
      <div className={`grid w-full gap-2.5 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {items.map((item, index) => (
          <BounceIn key={item.id} index={index} shown={hexSpoken} className="flex min-w-0">
            <motion.button
              type="button"
              onClick={() => tap(item.id)}
              animate={{ x: wrongId === item.id ? SHAKE : 0, scale: got.includes(item.id) ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.35 }}
              whileTap={{ scale: 0.97 }}
              className={`${CARD_BODY_FLAT} ${RAISED} min-h-[60px] min-w-0 flex-1 cursor-pointer flex-col gap-0.5 px-1.5 py-1.5 ${buttonLook(got.includes(item.id) ? "right" : wrongId === item.id ? "wrong" : "idle", index)}`}
            >
              <span className={CARD_TEXT}>{item.label}</span>
              {item.sub && <span className="text-[12px] leading-4 font-medium text-[#6B7480] dark:text-white/60">{item.sub}</span>}
            </motion.button>
          </BounceIn>
        ))}
      </div>
      <p className={NOTE}>{note}</p>
    </div>
  );
}

export type SceneRevealItem = {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  /** The scene's value this one sets, and what to (1 by default). */
  key: string;
  value?: number;
  /** What is said about it once it is tapped. */
  caption?: string;
};

/**
 * Tap the buttons to find out what each one is: the scene shows it (its card opens, its tag appears). It is done
 * once `need` of them have been tapped (all, by default). `exclusive`: the scene shows only the one tapped last
 * (TRUE or FALSE), not every one so far. `footer` shows in place of the caption once it is done.
 */
export function SceneRevealStage({
  api,
  items,
  need = items.length,
  columns = 2,
  exclusive = false,
  doneValues,
  footer,
}: {
  api: InteractionApi;
  items: readonly SceneRevealItem[];
  need?: number;
  columns?: 2 | 3 | 4 | 5;
  exclusive?: boolean;
  doneValues?: SceneValues;
  footer?: ReactNode;
}) {
  const { done, finished, hexSpoken } = api;
  const [seen, setSeen] = useState<readonly string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const shown = items.find((item) => item.id === current);
  const hasCaptions = items.some((item) => item.caption);

  const values = useMemo(() => {
    const lit = exclusive ? items.filter((item) => item.id === current) : items.filter((item) => seen.includes(item.id));
    return { ...Object.fromEntries(lit.map((item) => [item.key, item.value ?? 1])), ...(finished ? doneValues : undefined) };
  }, [items, seen, current, exclusive, doneValues, finished]);
  useSceneValues(api, values);
  useFinishWhen(seen.length >= need, done, 700);

  const grid = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[columns];
  const small = columns >= 4;
  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-3`}>
      <div className={`grid w-full ${small ? "gap-2" : "gap-2.5"} ${grid}`}>
        {items.map((item, index) => {
          const tapped = seen.includes(item.id);
          return (
            <BounceIn key={item.id} index={index} shown={hexSpoken} className="flex min-w-0">
              <motion.button
                type="button"
                onClick={() => {
                  playClickSound();
                  vibrateForTap();
                  setCurrent(item.id);
                  setSeen((now) => (now.includes(item.id) ? now : [...now, item.id]));
                }}
                animate={{ scale: current === item.id ? [1, 0.96, 1.03, 1] : 1 }}
                transition={{ duration: 0.35 }}
                whileTap={{ scale: 0.97 }}
                className={`${CARD_BODY_FLAT} ${RAISED} relative min-w-0 flex-1 cursor-pointer flex-col gap-0.5 px-1 ${small ? "min-h-[64px] py-1" : "min-h-[60px] py-1.5"} ${tintAt(index)} ${current === item.id ? `${EDGE_READING} ${EDGE.mint}` : `${EDGE_IDLE} ${EDGE.khaki}`}`}
              >
                {tapped && <Check aria-hidden className="absolute top-0.5 right-0.5 size-3.5 text-[#10B48C]" strokeWidth={3} />}
                {item.icon && <Pic src={item.icon} className={small ? "h-6 w-6" : "h-7 w-7"} />}
                <span className={small ? "text-[13px] leading-[110%] font-semibold text-[#444444] dark:text-white" : CARD_TEXT}>{item.label}</span>
                {item.sub && <span className="text-[11px] leading-3 font-medium text-[#6B7480] dark:text-white/60">{item.sub}</span>}
              </motion.button>
            </BounceIn>
          );
        })}
      </div>
      {(hasCaptions || footer) && (
        <div className="flex min-h-[48px] w-full items-center justify-center">
          <AnimatePresence mode="wait">
            {finished && footer ? (
              <motion.div key="footer" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {footer}
              </motion.div>
            ) : (
              <motion.p
                key={shown?.id ?? "none"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`rounded-[12px] px-3 py-2 text-center text-[15px] leading-5 font-semibold ${shown?.caption ? "bg-white text-[#444444] shadow-[0_2px_8px_rgba(31,42,68,0.12)] dark:bg-[#15181E] dark:text-white" : `${PROMPT}`}`}
              >
                {shown?.caption ?? "Tap each one."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export type SceneToggleItem = {
  id: string;
  title: string;
  on: string;
  off: string;
  icon: string;
  /** The scene's switch for it (1 on, 0 off). */
  key: string;
};

/** Tap each one to switch it between its two states (the scene switches with it); it is done once each has been switched. */
export function SceneToggleStage({ api, items }: { api: InteractionApi; items: readonly SceneToggleItem[] }) {
  const { done, hexSpoken } = api;
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [flipped, setFlipped] = useState<readonly string[]>([]);

  const values = useMemo(() => Object.fromEntries(items.map((item) => [item.key, on[item.id] ? 1 : 0])), [items, on]);
  useSceneValues(api, values);
  useFinishWhen(flipped.length >= items.length, done, 800);

  return (
    <div className={`pointer-events-auto grid ${STAGE_W} grid-cols-2 gap-2.5`}>
      {items.map((item, index) => {
        const state = !!on[item.id];
        return (
          <BounceIn key={item.id} index={index} shown={hexSpoken} className="flex min-w-0">
            <motion.button
              type="button"
              onClick={() => {
                playClickSound();
                vibrateForTap();
                setOn((now) => ({ ...now, [item.id]: !now[item.id] }));
                setFlipped((now) => (now.includes(item.id) ? now : [...now, item.id]));
              }}
              whileTap={{ scale: 0.96 }}
              className={`${CARD_BODY_FLAT} ${RAISED} h-[66px] min-w-0 flex-1 cursor-pointer gap-2 px-2 ${tintAt(index)} ${EDGE_IDLE} ${EDGE.khaki}`}
            >
              <Pic src={item.icon} className="h-8 w-8 shrink-0" />
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="text-[12px] leading-4 font-semibold text-[#6B7480] dark:text-white/60">{item.title}</span>
                <motion.span
                  key={String(state)}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`rounded-full px-2.5 py-0.5 text-[13px] leading-4 font-bold text-white ${state ? "bg-[#01A17F]" : "bg-[#8A94A0]"}`}
                >
                  {state ? item.on : item.off}
                </motion.span>
              </span>
            </motion.button>
          </BounceIn>
        );
      })}
    </div>
  );
}

export type SceneTourGroup = {
  id: string;
  name: string;
  tint: GroupTint;
  /** The colour of the group's name (a text colour class). */
  ink: string;
  /** The scene's value that outlines the group. */
  key: string;
  /** What Hex says about the group once it is read. */
  caption: string;
};

const TOUR_ENTRY_KEY = "datatypes-groups-tour";

/**
 * The tour of screen 4's three groups: each is read by tapping its name, or by Continue, which goes through them
 * one by one and, after the last, on to the next screen. Reading a group outlines it in the scene, sends Hex's line
 * above away, and Hex speaks from under the scene about what the group tells us. Nothing has to be tapped.
 */
export function SceneTourStage({ api, groups }: { api: InteractionApi; groups: readonly SceneTourGroup[] }) {
  const { dismissHex, takeContinue, hexSpoken } = api;
  const [current, setCurrent] = useState<string | null>(null);
  const shown = groups.find((group) => group.id === current);

  const values = useMemo(() => (shown ? { [shown.key]: 1 } : {}), [shown]);
  useSceneValues(api, values);

  const read = useCallback(
    (id: string) => {
      playClickSound();
      vibrateForTap();
      dismissHex();
      setCurrent(id);
    },
    [dismissHex],
  );

  // Continue reads the group after the one just read (the first, if none yet); after the last it lets Continue go on.
  useEffect(() => {
    if (!takeContinue) return;
    takeContinue(() => {
      const next = groups[groups.findIndex((group) => group.id === current) + 1];
      if (!next) return false;
      read(next.id);
      return true;
    });
    return () => takeContinue(null);
  }, [takeContinue, groups, current, read]);

  return (
    <div className={`pointer-events-auto flex ${STAGE_W} flex-col items-center gap-3`}>
      <div className="grid w-full grid-cols-3 gap-2.5">
        {groups.map((group, index) => {
          const reading = current === group.id;
          return (
            <BounceIn key={group.id} index={index} shown={hexSpoken || !!current} className="flex min-w-0">
              <motion.button
                type="button"
                aria-pressed={reading}
                onClick={() => read(group.id)}
                animate={{ scale: reading ? [1, 0.96, 1.03, 1] : 1 }}
                transition={{ duration: 0.35 }}
                whileTap={{ scale: 0.97 }}
                className={`flex h-[48px] min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[10px] border-2 text-[16px] leading-none font-semibold transition-colors ${TINTS[group.tint]} ${group.ink} ${
                  reading ? EDGE_READING : "border-transparent"
                }`}
              >
                {group.name}
              </motion.button>
            </BounceIn>
          );
        })}
      </div>
      {/* Hex's row is kept free from the start, so nothing moves when he arrives. */}
      <div className="flex h-[110px] w-full items-start justify-start">
        {shown && <HexBubble key={shown.id} entryKey={TOUR_ENTRY_KEY} hex="left" line={[{ text: shown.caption }]} size={{ width: 220 }} />}
      </div>
    </div>
  );
}

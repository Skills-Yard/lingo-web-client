"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, EventType } from "@rive-app/canvas";
import { configureRiveRuntime } from "@/lib/rive/runtime";

configureRiveRuntime();

const HEX_RIVE_SRC = "/animations/hex.riv";
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

type Playable = { kind: "animation" | "stateMachine"; name: string };

const keyOf = (item: Playable) => `${item.kind}:${item.name}`;

type HexPlayerProps = {
  artboard?: string;
  onArtboards: (names: string[]) => void;
};

/** Remounted (via `key`) whenever the artboard changes. */
const HexPlayer = ({ artboard, onArtboards }: HexPlayerProps) => {
  const { rive, RiveComponent } = useRive({
    src: HEX_RIVE_SRC,
    artboard,
    autoplay: false,
    layout: LAYOUT,
  });
  const [items, setItems] = useState<Playable[]>([]);
  const [index, setIndex] = useState(0);
  const [looping, setLooping] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!rive) return;
    onArtboards(rive.contents?.artboards?.map((a) => a.name) ?? []);
    setItems([
      ...rive.animationNames.map((name): Playable => ({ kind: "animation", name })),
      ...rive.stateMachineNames.map((name): Playable => ({ kind: "stateMachine", name })),
    ]);
    setIndex(0);
  }, [rive, onArtboards]);

  const current = items[index];

  // Reinitialises the artboard to its default state, so nothing from the
  // previous animation carries over, then plays only the selected one.
  const playFresh = useCallback(
    (item: Playable) => {
      if (!rive) return;
      rive.reset({
        artboard: rive.activeArtboard,
        animations: item.kind === "animation" ? item.name : undefined,
        stateMachines: item.kind === "stateMachine" ? item.name : undefined,
        autoplay: true,
      });
      setPaused(false);
    },
    [rive],
  );

  useEffect(() => {
    if (current) playFresh(current);
  }, [current, playFresh]);

  // Restart one-shot animations when "loop" is off and they finish.
  useEffect(() => {
    if (!rive || !current || current.kind !== "animation") return;
    const onStop = () => {
      if (looping) rive.play(current.name);
    };
    rive.on(EventType.Stop, onStop);
    return () => rive.off(EventType.Stop, onStop);
  }, [rive, current, looping]);

  const go = useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      setIndex((i) => (i + delta + items.length) % items.length);
    },
    [items.length],
  );

  const togglePause = () => {
    if (!rive || !current) return;
    if (paused) rive.play(current.name);
    else rive.pause();
    setPaused(!paused);
  };

  const replay = () => {
    if (current) playFresh(current);
  };

  const options = useMemo(
    () =>
      items.map((item, i) => (
        <option key={keyOf(item)} value={i}>
          {item.kind === "stateMachine" ? "⚙ " : "▶ "}
          {item.name.trim() || "(unnamed)"}
        </option>
      )),
    [items],
  );

  return (
    <>
      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card">
        <RiveComponent className="h-full w-full" />
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {items.length === 0 ? "Loading…" : `${index + 1} / ${items.length}`}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {current?.kind === "stateMachine" ? "State machine" : "Animation"}
          </span>
        </div>

        <select
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          disabled={items.length === 0}
          className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-base text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => go(-1)} className={secondaryButton}>
            ← Previous
          </button>
          <button type="button" onClick={() => go(1)} className={primaryButton}>
            Next →
          </button>
          <button type="button" onClick={replay} className={secondaryButton}>
            Replay
          </button>
          <button type="button" onClick={togglePause} className={secondaryButton}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={looping}
            onChange={(e) => setLooping(e.target.checked)}
            className="size-4 accent-primary"
          />
          Loop animations
        </label>
      </div>
    </>
  );
};

const primaryButton =
  "h-12 rounded-2xl bg-primary px-4 font-medium text-primary-foreground transition-transform active:scale-[0.96]";
const secondaryButton =
  "h-12 rounded-2xl border border-border bg-card px-4 font-medium text-card-foreground transition-transform active:scale-[0.96]";

const HexPage = () => {
  const [artboards, setArtboards] = useState<string[]>([]);
  const [artboard, setArtboard] = useState<string | undefined>(undefined);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10 text-foreground">
      <h1 className="text-2xl font-semibold">hex.riv</h1>

      {artboards.length > 1 && (
        <select
          value={artboard ?? artboards[0]}
          onChange={(e) => setArtboard(e.target.value)}
          className="h-10 rounded-2xl border border-input bg-card px-4 text-sm text-card-foreground"
        >
          {artboards.map((name) => (
            <option key={name} value={name}>
              Artboard: {name}
            </option>
          ))}
        </select>
      )}

      <HexPlayer key={artboard ?? "default"} artboard={artboard} onArtboards={setArtboards} />
    </main>
  );
};

export default HexPage;

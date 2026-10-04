"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { Layout, Fit, Alignment, EventType } from "@rive-app/canvas";
import { configureRiveRuntime } from "@/lib/rive/runtime";
import { useTheme } from "@/context/ThemeContext";

configureRiveRuntime();

const HEX_RIVE_SRC = "/animations/hex.riv";
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

type Playable = { kind: "animation" | "stateMachine"; name: string };

const keyOf = (item: Playable) => `${item.kind}:${item.name}`;

/** The hex movement clip plays by default: prefer "hex" + "move", then any "move". */
const findHexMovement = (items: Playable[]) => {
  const byName = (re: RegExp) => items.findIndex((item) => re.test(item.name));
  const hexMove = byName(/hex.*mov|mov.*hex/i);
  return hexMove >= 0 ? hexMove : byName(/mov/i);
};

type HexPlayerProps = {
  artboard?: string;
  onArtboards: (names: string[]) => void;
};

type Status = "playing" | "paused" | "stopped";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  className: "size-5",
  "aria-hidden": true,
} as const;

const PlayIcon = () => (
  <svg {...iconProps}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg {...iconProps}>
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);
const StopIcon = () => (
  <svg {...iconProps}>
    <path d="M6 6h12v12H6z" />
  </svg>
);
const PrevIcon = () => (
  <svg {...iconProps}>
    <path d="M6 6h2v12H6zM9.5 12 18 18V6z" />
  </svg>
);
const NextIcon = () => (
  <svg {...iconProps}>
    <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
  </svg>
);

type IconButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const IconButton = ({ label, active = false, onClick, children }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={active}
    onClick={onClick}
    className={`flex size-12 items-center justify-center rounded-full border transition-[transform,background-color,color] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-card-foreground hover:bg-secondary"
    }`}
  >
    {children}
  </button>
);

/** Remounted (via `key`) whenever the artboard changes. */
const HexPlayer = ({ artboard, onArtboards }: HexPlayerProps) => {
  const [ready, setReady] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: HEX_RIVE_SRC,
    artboard,
    autoplay: false,
    layout: LAYOUT,
    onLoad: () => setReady(true),
  });
  const [items, setItems] = useState<Playable[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("stopped");

  useEffect(() => {
    if (!rive || !ready) return;
    onArtboards(rive.contents?.artboards?.map((a) => a.name) ?? []);
    const all: Playable[] = [
      ...rive.animationNames.map((name): Playable => ({ kind: "animation", name })),
      ...rive.stateMachineNames.map((name): Playable => ({ kind: "stateMachine", name })),
    ];
    setItems(all);
    setIndex(Math.max(0, findHexMovement(all)));
  }, [rive, ready, onArtboards]);

  const current = items[index];

  // `rive.reset()` rebuilds the whole artboard, which is what made switching
  // slow. Stopping everything and playing the selected clip from its start is
  // instant and still leaves only that one clip running.
  const load = useCallback(
    (item: Playable, autoplay: boolean) => {
      if (!rive) return;
      rive.stop();
      if (autoplay) {
        rive.play(item.name);
      } else if (item.kind === "animation") {
        rive.scrub(item.name, 0);
      }
      setStatus(autoplay ? "playing" : "stopped");
    },
    [rive],
  );

  // Selecting an animation (or arriving at the first one) plays it from a clean state.
  useEffect(() => {
    if (current) load(current, true);
  }, [current, load]);

  // Loop one-shot animations when they finish.
  useEffect(() => {
    if (!rive || !current || current.kind !== "animation") return;
    const onStop = () => {
      if (status === "playing") rive.play(current.name);
    };
    rive.on(EventType.Stop, onStop);
    return () => rive.off(EventType.Stop, onStop);
  }, [rive, current, status]);

  const go = useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      setIndex((i) => (i + delta + items.length) % items.length);
    },
    [items.length],
  );

  const play = () => {
    if (!rive || !current || status === "playing") return;
    if (status === "paused") {
      rive.play(current.name);
      setStatus("playing");
    } else {
      load(current, true);
    }
  };

  const pause = () => {
    if (!rive || status !== "playing") return;
    rive.pause();
    setStatus("paused");
  };

  const stop = () => {
    if (current) load(current, false);
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

  const controlsReady = ready && items.length > 0;

  return (
    <>
      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card">
        <RiveComponent
          className="h-full w-full transition-opacity duration-300"
          style={{ opacity: controlsReady ? 1 : 0 }}
        />
        {!controlsReady && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
          >
            <span className="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
            <span className="text-sm">Loading animation…</span>
          </div>
        )}
      </div>

      {controlsReady && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <select
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            aria-label="Animation"
            className="h-12 w-full rounded-2xl border border-input bg-card px-4 text-base text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {options}
          </select>

          <div className="flex items-center justify-center gap-3">
            <IconButton label="Previous animation" onClick={() => go(-1)}>
              <PrevIcon />
            </IconButton>
            <IconButton label="Play" active={status === "playing"} onClick={play}>
              <PlayIcon />
            </IconButton>
            <IconButton label="Pause" active={status === "paused"} onClick={pause}>
              <PauseIcon />
            </IconButton>
            <IconButton label="Stop" active={status === "stopped"} onClick={stop}>
              <StopIcon />
            </IconButton>
            <IconButton label="Next animation" onClick={() => go(1)}>
              <NextIcon />
            </IconButton>
          </div>

          <p className="text-center text-sm text-muted-foreground tabular-nums">
            {index + 1} / {items.length}
          </p>
        </div>
      )}
    </>
  );
};

const HexPage = () => {
  const { theme, setTheme } = useTheme();

  // Dark by default, unless a theme was already chosen on a previous visit.
  useEffect(() => {
    try {
      if (!localStorage.getItem("lingo_theme")) setTheme("dark", "instant");
    } catch {
      setTheme("dark", "instant");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
  const [artboard, setArtboard] = useState<string | undefined>(undefined);

  // Only the hex artboard is shown; fall back to the file's default if none is named "hex".
  const pickHexArtboard = useCallback((names: string[]) => {
    const hex = names.find((name) => /hex/i.test(name));
    if (hex) setArtboard(hex);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-background px-4 py-10 text-foreground">
      <div className="flex w-full max-w-md items-center justify-between">
        <h1 className="text-2xl font-semibold">hex.riv</h1>
        <div
          role="group"
          aria-label="Theme"
          className="flex rounded-full border border-border bg-card p-1 text-sm"
        >
          {(["light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={theme === mode}
              onClick={() => theme !== mode && setTheme(mode)}
              className={`h-9 rounded-full px-4 font-medium capitalize transition-colors ${
                theme === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <HexPlayer key={artboard ?? "default"} artboard={artboard} onArtboards={pickHexArtboard} />
    </main>
  );
};

export default HexPage;

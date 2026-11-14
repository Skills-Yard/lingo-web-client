"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Focus, ListVideo, Pause, Play, RotateCw, Square } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ANIMATIONS } from "./character";
import { CharacterScene } from "./CharacterScene";
import { SCENES, TOUR, TOUR_VOICE, pictureAt } from "./show";
import { StageBackdrop, StagePicture } from "./StageDecor";
import { useCharacter, type CharacterState } from "./useCharacter";
import { useShow } from "./useShow";
import { useVoice } from "./useVoice";

type ControlButtonProps = {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
};

const ControlButton = ({ label, pressed, onClick, children }: ControlButtonProps) => (
  <button
    type="button"
    aria-pressed={pressed}
    onClick={onClick}
    className={`flex h-12 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-[transform,background-color,color] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      pressed
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-card-foreground hover:bg-secondary"
    }`}
  >
    {children}
    {label}
  </button>
);

type AnimationPickerProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Tapping the animation that is already chosen plays it again from the start. */
const AnimationPicker = ({ selectedId, onSelect }: AnimationPickerProps) => (
  <div role="group" aria-label="Animation" className="flex w-full max-w-2xl flex-wrap justify-center gap-2 text-sm">
    {ANIMATIONS.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        aria-pressed={selectedId === id}
        onClick={() => onSelect(id)}
        className={`h-10 rounded-full border px-4 font-medium transition-[transform,background-color,color] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          selectedId === id
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground/70 hover:bg-secondary hover:text-foreground"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const StageMessage = ({ children }: { children: ReactNode }) => (
  <div
    role="status"
    aria-live="polite"
    className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
  >
    {children}
  </div>
);

const LoadingMessage = ({ state }: { state: Extract<CharacterState, { status: "loading" }> }) => {
  const downloading = state.phase === "download";
  const percent = Math.round(state.fraction * 100);

  return (
    <StageMessage>
      <p className="text-base font-medium">
        {downloading ? "Downloading character…" : "Preparing character…"}
      </p>
      <div
        role="progressbar"
        aria-label="Loading the character"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={downloading ? percent : undefined}
        className="h-2 w-48 overflow-hidden rounded-full bg-border"
      >
        <div
          className={`h-full rounded-full bg-primary ${downloading ? "transition-[width] duration-150" : "animate-pulse"}`}
          style={{ width: downloading ? `${percent}%` : "100%" }}
        />
      </div>
      <p className="text-sm text-foreground/60 tabular-nums">
        {downloading ? `${percent}%` : "Almost there"}
      </p>
    </StageMessage>
  );
};

const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <StageMessage>
    <p className="text-base font-medium">The character couldn&apos;t be loaded.</p>
    <p className="text-sm text-foreground/60">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="h-12 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Try again
    </button>
  </StageMessage>
);

export const CharacterViewer = () => {
  const { state, retry } = useCharacter();
  const [show, dispatch] = useShow();
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const scene = SCENES[show.animationId];
  const picture = scene?.pictures ? pictureAt(scene.pictures, show.loops) : null;

  const handleLoop = useCallback(() => dispatch({ type: "loop" }), [dispatch]);
  const handleVoiceEnded = useCallback((failed: boolean) => dispatch({ type: "voiceEnded", failed }), [dispatch]);
  const { prime } = useVoice({
    src: scene?.voice,
    runToken: show.runToken,
    playing: show.playing,
    onEnded: handleVoiceEnded,
  });

  const touring = show.step !== null;
  const toggleTour = () => {
    if (touring) {
      dispatch({ type: "stopTour" });
      return;
    }
    // Part of the tap: a browser may not start the voice later unless it was allowed to by now.
    prime(TOUR_VOICE);
    dispatch({ type: "playAll" });
  };

  const animationLabel = ANIMATIONS.find(({ id }) => id === show.animationId)?.label;

  return (
    <main className="flex min-h-screen flex-col items-center gap-5 bg-background px-4 pt-(--screen-top) pb-10 text-foreground">
      <header className="flex w-full max-w-2xl items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">3D character</h1>
          <p className="truncate text-sm text-foreground/60">
            {animationLabel}
            {show.step !== null && ` · ${show.step + 1} of ${TOUR.length}`}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div
        className="relative h-[min(60vh,640px)] w-full max-w-2xl overflow-hidden rounded-3xl border border-border"
        style={{ background: "radial-gradient(ellipse at 50% 75%, var(--secondary) 0%, var(--card) 72%)" }}
      >
        <StageBackdrop />
        {state.status === "ready" && (
          <CharacterScene
            character={state.character}
            animationId={show.animationId}
            runToken={show.runToken}
            playing={show.playing}
            autoRotate={autoRotate}
            resetToken={resetToken}
            onLoop={handleLoop}
          />
        )}
        <StagePicture picture={picture} />
        {state.status === "loading" && <LoadingMessage state={state} />}
        {state.status === "error" && <ErrorMessage message={state.message} onRetry={retry} />}
      </div>

      {state.status === "ready" && (
        <>
          <AnimationPicker selectedId={show.animationId} onSelect={(id) => dispatch({ type: "pick", id })} />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ControlButton label={touring ? "Stop tour" : "Play all"} pressed={touring} onClick={toggleTour}>
              {touring ? <Square className="size-5" aria-hidden /> : <ListVideo className="size-5" aria-hidden />}
            </ControlButton>
            <ControlButton
              label={show.playing ? "Pause" : "Play"}
              onClick={() => dispatch({ type: "togglePlaying" })}
            >
              {show.playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
            </ControlButton>
            <ControlButton label="Auto-rotate" pressed={autoRotate} onClick={() => setAutoRotate((r) => !r)}>
              <RotateCw className="size-5" aria-hidden />
            </ControlButton>
            <ControlButton label="Reset view" onClick={() => setResetToken((n) => n + 1)}>
              <Focus className="size-5" aria-hidden />
            </ControlButton>
          </div>
          <p className="text-center text-sm text-foreground/60">
            Drag to rotate. Pick one animation, or Play all to see them in turn.
          </p>
        </>
      )}
    </main>
  );
};

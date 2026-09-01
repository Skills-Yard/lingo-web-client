import { useState, useCallback, useRef, useEffect } from "react";
import { CommandType, Position, Direction, LevelConfig } from "./types";

// Ported from lingo-website-client/src/hooks/useGameState.ts

export function useGameState(
  level: LevelConfig,
  triggerSound: (type: "tap" | "step" | "pickup" | "win" | "lose" | "hint") => void,
  soundEnabled: boolean,
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>
) {
  const [commands, setCommands] = useState<(CommandType | null)[]>(Array(level.maxSlots).fill(null));
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerPos, setPlayerPos] = useState<Position>({ ...level.startPos });
  const [playerDir, setPlayerDir] = useState<Direction>(level.startDir);
  const [collectedStar, setCollectedStar] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [executingStep, setExecutingStep] = useState<number | null>(null);
  const [failureMsg, setFailureMsg] = useState("");

  const executionTimerRef = useRef<NodeJS.Timeout[]>([]);

  const resetLevel = useCallback(
    (keepCommands = false) => {
      executionTimerRef.current.forEach(clearTimeout);
      executionTimerRef.current = [];
      setPlayerPos({ ...level.startPos });
      setPlayerDir(level.startDir);
      setCollectedStar(false);
      setSuccess(null);
      setExecutingStep(null);
      setIsPlaying(false);
      setFailureMsg("");
      if (!keepCommands) setCommands(Array(level.maxSlots).fill(null));
    },
    [level]
  );

  // Reset state when level config changes
  useEffect(() => {
    const t = setTimeout(() => resetLevel(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const addCommand = useCallback(
    (type: CommandType) => {
      if (isPlaying || success !== null) return;
      triggerSound("tap");
      const idx = commands.findIndex((c) => c === null);
      if (idx !== -1) {
        const nc = [...commands];
        nc[idx] = type;
        setCommands(nc);
      }
    },
    [commands, isPlaying, success, triggerSound]
  );

  const removeCommand = useCallback(
    (index: number) => {
      if (isPlaying || success !== null) return;
      triggerSound("tap");
      const nc = [...commands];
      nc[index] = null;
      setCommands(nc);
    },
    [commands, isPlaying, success, triggerSound]
  );

  const fillHint = useCallback(() => {
    triggerSound("hint");
    const nc = Array(commands.length).fill(null);
    level.hints.forEach((h, i) => {
      if (i < nc.length) nc[i] = h as CommandType;
    });
    setCommands(nc);
  }, [commands.length, level.hints, triggerSound]);

  return {
    commands,
    setCommands,
    isPlaying,
    setIsPlaying,
    playerPos,
    setPlayerPos,
    playerDir,
    setPlayerDir,
    collectedStar,
    setCollectedStar,
    success,
    setSuccess,
    executingStep,
    setExecutingStep,
    failureMsg,
    setFailureMsg,
    soundEnabled,
    setSoundEnabled,
    executionTimerRef,
    resetLevel,
    addCommand,
    removeCommand,
    fillHint,
  };
}
export type GameState = ReturnType<typeof useGameState>;

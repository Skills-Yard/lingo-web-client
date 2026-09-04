import { useEffect, useRef, useCallback } from "react";
import { CommandType, LevelConfig } from "./types";
import { GameState } from "./useGameState";

// Ported from lingo-website-client/src/hooks/useGameExecution.ts.
// The intro flow has no lives system, so the `hearts` handling from the
// original hook is dropped — a failed run just shows a message and lets the
// learner reset and try again.

export function useGameExecution({
  level,
  gameState,
  triggerSound,
}: {
  level: LevelConfig;
  gameState: GameState;
  triggerSound: (type: "tap" | "step" | "pickup" | "win" | "lose" | "hint") => void;
}) {
  const {
    commands,
    isPlaying,
    setIsPlaying,
    setPlayerPos,
    setPlayerDir,
    setCollectedStar,
    success,
    setSuccess,
    setExecutingStep,
    setFailureMsg,
    executionTimerRef,
  } = gameState;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti effect
  useEffect(() => {
    if (success !== true) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#FFC107", "#FF5722", "#E91E63", "#9C27B0", "#3F51B5", "#00BCD4", "#4CAF50", "#8BC34A"];
    const ps = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height + 20,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 10,
      rot: Math.random() * 360,
      rs: (Math.random() - 0.5) * 10,
    }));
    let id: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      ps.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.rot += p.rs;
        if (p.y < canvas.height + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (alive) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [success]);

  const runSequence = useCallback(() => {
    if (isPlaying || success !== null) return;
    const active = commands.filter((c): c is CommandType => c !== null);
    if (!active.length) return;
    setIsPlaying(true);
    setExecutingStep(0);
    let pos = { ...level.startPos };
    let dir = level.startDir;
    let starPicked = false;

    active.forEach((cmd, idx) => {
      const t = setTimeout(() => {
        setExecutingStep(idx);
        if (cmd === "straight" || cmd === "back") {
          const m = cmd === "straight" ? 1 : -1;
          let nr = pos.r,
            nc = pos.c;
          if (dir === "up") nr -= m;
          else if (dir === "right") nc += m;
          else if (dir === "down") nr += m;
          else nc -= m;
          if (nr < 0 || nr >= level.gridRows || nc < 0 || nc >= level.gridCols) {
            triggerSound("lose");
            setFailureMsg("Oh no! Lumi fell off the platform!");
            setSuccess(false);
            setIsPlaying(false);
            executionTimerRef.current.slice(idx + 1).forEach(clearTimeout);
            return;
          }
          if (level.obstacles.find((o) => o.r === nr && o.c === nc)) {
            triggerSound("lose");
            setFailureMsg("Crash! Lumi ran into a rock or tree!");
            setSuccess(false);
            setIsPlaying(false);
            executionTimerRef.current.slice(idx + 1).forEach(clearTimeout);
            return;
          }
          pos = { r: nr, c: nc };
          setPlayerPos(pos);
          triggerSound("step");
        } else if (cmd === "left") {
          if (dir === "up") dir = "left";
          else if (dir === "left") dir = "down";
          else if (dir === "down") dir = "right";
          else if (dir === "right") dir = "up";
          setPlayerDir(dir);
          triggerSound("step");
        } else if (cmd === "right") {
          if (dir === "up") dir = "right";
          else if (dir === "right") dir = "down";
          else if (dir === "down") dir = "left";
          else if (dir === "left") dir = "up";
          setPlayerDir(dir);
          triggerSound("step");
        } else if (cmd === "pickup") {
          if (level.starPos && pos.r === level.starPos.r && pos.c === level.starPos.c) {
            starPicked = true;
            setCollectedStar(true);
            triggerSound("pickup");
          } else triggerSound("lose");
        }

        // ── Check if Lumi reached the flag after every step ──
        const atFlag = pos.r === level.flagPos.r && pos.c === level.flagPos.c;
        const starOk = level.starPos ? starPicked : true;
        if (atFlag && starOk) {
          executionTimerRef.current.slice(idx + 1).forEach(clearTimeout);
          setTimeout(() => {
            triggerSound("win");
            setSuccess(true);
            setIsPlaying(false);
          }, 600);
          return;
        }

        if (idx === active.length - 1) {
          setTimeout(() => {
            triggerSound("lose");
            setFailureMsg(atFlag && !starOk ? "Forgot the star! ⭐" : "Didn't reach the flag.");
            setSuccess(false);
            setIsPlaying(false);
          }, 600);
        }
      }, (idx + 1) * 700);
      executionTimerRef.current.push(t);
    });
  }, [
    isPlaying,
    success,
    commands,
    level,
    triggerSound,
    setExecutingStep,
    setFailureMsg,
    setSuccess,
    setIsPlaying,
    setPlayerPos,
    setPlayerDir,
    setCollectedStar,
    executionTimerRef,
  ]);

  return {
    canvasRef,
    runSequence,
  };
}

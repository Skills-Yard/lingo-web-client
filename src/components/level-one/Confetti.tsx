"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#FFC107", "#FF5722", "#E91E63", "#9C27B0", "#3F51B5", "#00BCD4", "#4CAF50", "#8BC34A"];

/**
 * The win confetti from the game board (same burst: 120 pieces shot up from
 * the bottom edge, falling back under gravity), as a standalone overlay.
 * Plays once each time `active` turns on, and plays to the end even if `active`
 * turns off meanwhile (the learner pressed Next): only a new burst, or the
 * overlay going away, cuts it short.
 */
export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // A burst still falling gives way to the new one (two loops would wipe each other's frames).
    cancelAnimationFrame(frameRef.current);
    // The canvas is sized on the next frame, not here: a screen that celebrates the moment it
    // opens runs this before its stage is measured, and a canvas sized then is drawn tiny and
    // stretched into huge, blurry pieces.
    const start = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const pieces = Array.from({ length: 120 }, () => ({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height + 20,
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 15 - 10,
        rot: Math.random() * 360,
        spin: (Math.random() - 0.5) * 10,
      }));
      const tick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (const p of pieces) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35;
          p.rot += p.spin;
          if (p.y < canvas.height + 20) alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
        if (alive) frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    };
    frameRef.current = requestAnimationFrame(start);
  }, [active]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}

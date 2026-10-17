"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#FFC107", "#FF5722", "#E91E63", "#9C27B0", "#3F51B5", "#00BCD4", "#4CAF50", "#8BC34A"];

/**
 * The win confetti from the game board (same burst: 120 pieces shot up from
 * the bottom edge, falling back under gravity), as a standalone overlay.
 * Plays once each time `active` turns on.
 */
export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
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
    let frame = 0;
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
      if (alive) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}

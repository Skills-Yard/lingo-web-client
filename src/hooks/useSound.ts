import { useCallback } from 'react';

export function useSound(soundEnabled: boolean) {
  const triggerSound = useCallback((type: 'tap' | 'step' | 'pickup' | 'win' | 'lose' | 'hint') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const tone = (f: number, dur: number, kind: OscillatorType = 'sine', t0 = 0) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = kind;
        o.frequency.value = f;
        g.gain.setValueAtTime(0.12, ctx.currentTime + t0);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(ctx.currentTime + t0);
        o.stop(ctx.currentTime + t0 + dur);
      };
      switch (type) {
        case 'tap':
          tone(600, 0.08, 'triangle');
          break;
        case 'step':
          tone(200, 0.06);
          tone(220, 0.06, 'sine', 0.04);
          break;
        case 'pickup':
          tone(523.25, 0.1);
          tone(659.25, 0.1, 'sine', 0.06);
          tone(783.99, 0.1, 'sine', 0.12);
          tone(1046.50, 0.25, 'sine', 0.18);
          break;
        case 'win':
          [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
            tone(f, 0.18, 'triangle', i * 0.07)
          );
          break;
        case 'lose': {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(220, ctx.currentTime);
          o.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
          g.gain.setValueAtTime(0.15, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 0.4);
          break;
        }
        case 'hint':
          tone(440, 0.1);
          tone(554.37, 0.15, 'sine', 0.05);
          break;
      }
    } catch { }
  }, [soundEnabled]);

  return triggerSound;
}

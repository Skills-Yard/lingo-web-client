"use client";

import type { CSSProperties, ReactNode } from "react";

/** A section of the gallery: a heading, what it holds, and the demos. */
export function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-[22px] leading-8 font-semibold text-[#444444] dark:text-white">{title}</h2>
      {note && <p className="mt-1 max-w-[720px] text-[14px] leading-5 text-[#6B7480] dark:text-white/60">{note}</p>}
      <div className="mt-5 flex flex-wrap items-start gap-6">{children}</div>
    </section>
  );
}

/** One demo: its name (the component), a line on it, and the component working. */
export function Demo({ name, note, children, className = "" }: { name: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 max-w-full flex-col gap-2 ${className}`}>
      <div>
        <h3 className="font-mono text-[14px] leading-5 font-semibold text-[#08A4AD]">{name}</h3>
        {note && <p className="max-w-[390px] text-[12px] leading-4 text-[#6B7480] dark:text-white/60">{note}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * A phone-sized box to show a component in. It is positioned, and carries the stage sizes
 * (`--stage-w`, `--stage-scale`) that lesson-screen components size themselves from.
 */
export function Phone({ height = 420, children, className = "" }: { height?: number; children: ReactNode; className?: string }) {
  const style = { width: 390, height, maxWidth: "100%", "--stage-w": "390px", "--stage-scale": 1 } as CSSProperties;
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-[28px] border border-black/10 bg-white dark:border-white/15 dark:bg-background ${className}`} style={style}>
      {children}
    </div>
  );
}

/** A plain box for demos that need a width but no phone. */
export function Panel({ children, width = 390, className = "" }: { children: ReactNode; width?: number; className?: string }) {
  return (
    <div className={`flex max-w-full flex-col items-center gap-3 rounded-[20px] border border-black/10 bg-white/70 p-4 dark:border-white/15 dark:bg-white/5 ${className}`} style={{ width }}>
      {children}
    </div>
  );
}

/** A small button for the gallery's own controls. */
export function Tool({ label, onClick, active = false }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-md border px-2.5 py-1 text-[12px] leading-4 font-semibold transition-colors ${
        active ? "border-[#08A4AD] bg-[#08A4AD] text-white" : "border-black/15 bg-white text-[#444444] hover:bg-black/5 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

export function Tools({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

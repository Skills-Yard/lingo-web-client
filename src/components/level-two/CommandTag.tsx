/**
 * The design's tilted terminal window (the Command module's counterpart of the Variable module's "age = 20" tag): a blue bar with the
 * three window dots over a dark body with a green prompt (`>`) and a white cursor line. Laid out at `left` / `top` (stage px, in the 390px
 * column), `width` wide, tipped by `tilt` degrees; it takes no taps.
 */
export function CommandTag({ left, top, width = 116, tilt = -8 }: { left: number; top: number; width?: number; tilt?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute" style={{ left, top, width, transform: `rotate(${tilt}deg)` }}>
      <div className="overflow-hidden rounded-[9px] shadow-[0_8px_16px_rgba(46,85,230,0.35)] ring-1 ring-white/40">
        <div className="flex h-[14px] items-center gap-[4px] bg-[#3F73F2] px-[7px]">
          <span className="size-[5px] rounded-full bg-[#FF5F57]" />
          <span className="size-[5px] rounded-full bg-[#FEBC2E]" />
          <span className="size-[5px] rounded-full bg-[#28C840]" />
        </div>
        <div className="flex h-[38px] items-center gap-[7px] bg-[linear-gradient(180deg,#27409F_0%,#1C2F8A_100%)] px-[14px]">
          <svg viewBox="0 0 16 16" className="size-[17px] shrink-0" fill="none" stroke="#3EE05A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 3 L11 8 L4 13" />
          </svg>
          <span className="mt-[9px] h-[3px] w-[18px] rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}

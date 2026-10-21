"use client";

import { useEffect, useRef, useState } from "react";

export type HomeNavTab = "home" | "career" | "events" | "dashboard" | "feed";

/** Every tab but Home draws its icon from public/images/nav. */
const TABS = [
  { id: "home", label: "Home", src: null },
  { id: "career", label: "Career", src: "/images/nav/career.png" },
  { id: "events", label: "Events", src: "/images/nav/events.png" },
  { id: "dashboard", label: "Dashboard", src: "/images/nav/dashboard.png" },
] as const satisfies readonly { id: HomeNavTab; label: string; src: string | null }[];

const ICON = "h-[22px] w-[22px]";

/** The 22px icon slot. On the active tab (the white-on-dark disc) Home, Career
 * and Events switch to solid versions; the rest are the grey artwork turned
 * white. The house is padded inside its viewBox so it sits in the middle of the
 * slot, as in the design. */
function NavIcon({ id, src, active }: { id: HomeNavTab; src: string | null; active?: boolean }) {
  const tone = `transition-colors duration-300 ${active ? "text-white" : "text-[#444444]"}`;
  if (id === "home") {
    return (
      <svg viewBox="-2.6 -2.6 29.2 29.2" className={`${ICON} ${tone}`} aria-hidden>
        {active ? (
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M11.2 2.9a1.2 1.2 0 0 1 1.6 0l8.3 7.4c.9.8.3 2.3-.9 2.3H19V19a2.2 2.2 0 0 1-2.2 2.2H7.2A2.2 2.2 0 0 1 5 19v-6.4H3.8c-1.2 0-1.8-1.500-.9-2.300ZM10 20.200h4v-4.700a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.500"
            strokeLinejoin="round"
            strokeLinecap="round"
            d="M4.500 10.500 12 3.500l7.500 7V19a1.500 1.500 0 0 1-1.500 1.500H6A1.500 1.500 0 0 1 4.500 19ZM9.500 20.500v-4.500a2.500 2.500 0 0 1 5 0v4.500"
          />
        )}
      </svg>
    );
  }
  if (active && id === "career") {
    return (
      <svg viewBox="0 0 24 24" className={`${ICON} ${tone}`} aria-hidden>
        <path
          fill="currentColor"
          d="M5 4.500h14A1.500 1.500 0 0 1 20.500 6v9A1.500 1.500 0 0 1 19 16.500h-5.250v1.800H16a.75.75 0 0 1 0 1.500H8a.75.75 0 0 1 0-1.500h2.250v-1.800H5A1.500 1.500 0 0 1 3.500 15V6A1.500 1.500 0 0 1 5 4.500Z"
        />
      </svg>
    );
  }
  if (active && id === "events") {
    return (
      <svg viewBox="0 0 24 24" className={`${ICON} ${tone}`} aria-hidden>
        <path
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.500"
          strokeLinejoin="round"
          d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800L12 16.800l-5.200 2.800 1-5.800-4.300-4.100 5.900-.8Z"
        />
      </svg>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? ""}
      alt=""
      draggable={false}
      className={`${ICON} select-none object-contain transition-[filter] duration-300 ${active ? "brightness-0 invert" : ""}`}
    />
  );
}

const SURFACE = "border border-black/10 shadow-[0_6px_20px_rgba(0,0,0,0.12)]";

/** The size the nav is drawn at; it is scaled as one piece to the width it is
 * given, so icons, labels and gaps keep their proportions on every screen. */
const DESIGN_W = 358;
const DESIGN_H = 60;

/** The home's floating nav (358 x 60 in the design): a white pill of four
 * tabs and, 16px beside it, a round Feed button. The active tab is a 48px dark
 * disc holding just its icon; the others show icon + label. */
export function HomeNav({
  active,
  onNavigate,
}: {
  active: HomeNavTab;
  onNavigate?: (tab: HomeNavTab) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => setScale(Math.min(box.clientWidth / DESIGN_W, 1));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  const feedActive = active === "feed";
  const activeIndex = TABS.findIndex((tab) => tab.id === active);
  const feedInk = feedActive ? "bg-white" : "bg-[#444444]";
  return (
    <div ref={boxRef} className="w-full">
    <div className="mx-auto" style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
    <nav
      className="flex h-[60px] w-[358px] origin-top-left items-center gap-4"
      style={{ transform: `scale(${scale})` }}
    >
      <div className={`relative flex h-[60px] min-w-0 flex-1 items-center rounded-[56px] bg-white px-[21px] ${SURFACE}`}>
        {/* The four tabs share the width in equal slots, so nothing reflows when
          the active one changes; the disc slides along behind them. */}
        <div className="relative flex h-12 w-full">
          <span
            aria-hidden
            className="absolute top-0.5 h-11 w-11 rounded-full bg-[#444444] transition-[left] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: activeIndex < 0 ? undefined : `calc(${activeIndex * 25}% + (25% - 44px) / 2)`,
              opacity: activeIndex < 0 ? 0 : 1,
            }}
          />
          {TABS.map(({ id, label, src }) => {
            const isActive = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate?.(id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className="relative flex h-12 flex-1 flex-col items-center justify-center"
              >
                {/* Only the icon grows (and drops into the disc's centre). */}
                <span
                  className="flex transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: isActive ? "translateY(6.5px) scale(1.18)" : "none" }}
                >
                  <NavIcon id={id} src={src} active={isActive} />
                </span>
                <span
                  className={`whitespace-nowrap text-[9px] font-medium leading-[13px] text-[#444444] transition-opacity duration-200 ${
                    isActive ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onNavigate?.("feed")}
        aria-current={feedActive ? "page" : undefined}
        className={`flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-full transition-colors duration-300 ${SURFACE} ${
          feedActive ? "bg-[#444444]" : "bg-white"
        }`}
      >
        <span className="relative flex h-[22px] w-[22px] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/nav/feed-square.png"
            alt=""
            draggable={false}
            className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 select-none object-contain ${feedActive ? "brightness-0 invert" : ""}`}
          />
          <span className={`absolute h-[1.5px] w-2.5 rounded-full transition-colors duration-300 ${feedInk}`} />
          <span className={`absolute h-2.5 w-[1.5px] rounded-full transition-colors duration-300 ${feedInk}`} />
        </span>
        <span
          className={`text-[9px] font-medium leading-[13px] ${feedActive ? "text-white" : "text-[#444444]"}`}
        >
          Feed
        </span>
      </button>
    </nav>
    </div>
    </div>
  );
}

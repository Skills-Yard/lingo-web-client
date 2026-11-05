"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { preload } from "react-dom";
import { useTheme } from "@/context/ThemeContext";
import { getRoomHost, setRoomDark, setRoomDress, setRoomFit, type RoomDress, type RoomFit } from "@/lib/rive/roomHost";
import { SEQUENCE_ROOM } from "@/lib/rive/runtime";

export type { RoomDress };

/**
 * The module's one bedroom (see `roomHost`), moved into this slot, which it
 * fills: `dress` is what the boy should have on, and a change plays the way
 * there. `fit` is "width" to keep the floor the art draws below the artboard,
 * "cover" to crop to a box.
 */
export function SequenceRoom({ dress, happy = false, fit = "width" }: { dress: RoomDress; happy?: boolean; fit?: RoomFit }) {
  preload(SEQUENCE_ROOM.src, { as: "fetch", crossOrigin: "anonymous" });
  const slot = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useLayoutEffect(() => {
    const element = slot.current;
    if (!element) return;
    const shared = getRoomHost();
    element.appendChild(shared.element);
    shared.rive?.resizeDrawingSurfaceToCanvas();
    const observer = new ResizeObserver(() => shared.rive?.resizeDrawingSurfaceToCanvas());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => setRoomFit(fit), [fit]);
  useEffect(() => setRoomDark(theme === "dark"), [theme]);
  useEffect(() => setRoomDress(dress, happy), [dress, happy]);

  return <div ref={slot} className="absolute inset-0" />;
}

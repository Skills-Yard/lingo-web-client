"use client";

import { AnimatePresence } from "framer-motion";
import {
  BUILDING_CONFIGS,
  DECORATION_CONFIGS,
  FINAL_ROAD,
  GATE,
  getPlatformDisplay,
  PLATFORM_CONFIGS,
  ROAD_CONFIGS,
  WORLD_STAGE_HEIGHT,
} from "./levelConfig";
import { LevelStartPopup } from "../LevelStartPopup";

interface LevelWorldProps {
  modulesCompleted: number;
  activeLevelNumber: number;
  selectedLevel: number | null;
  onLevelClick: (levelId: number) => void;
  onStartLesson: (levelId: number) => void;
  onClosePopup: () => void;
}

export function LevelWorld({
  modulesCompleted,
  activeLevelNumber,
  selectedLevel,
  onLevelClick,
  onStartLesson,
  onClosePopup,
}: LevelWorldProps) {
  const getLevelStatus = (id: number): "completed" | "active" | "locked" => {
    if (id <= modulesCompleted) return "completed";
    if (id === activeLevelNumber) return "active";
    return "locked";
  };

  const selectedLessonData = selectedLevel
    ? PLATFORM_CONFIGS.find((l) => l.id === selectedLevel) || PLATFORM_CONFIGS[0]
    : PLATFORM_CONFIGS[activeLevelNumber - 1] || PLATFORM_CONFIGS[0];

  const renderPlatform = (stepId: number) => {
    const config = PLATFORM_CONFIGS.find((p) => p.id === stepId)!;
    const status = getLevelStatus(stepId);
    const display = getPlatformDisplay(status, config.baseX, config.baseY);

    return (
      <div
        key={stepId}
        onClick={() => onLevelClick(stepId)}
        className="group absolute cursor-pointer transition-transform hover:scale-105 active:scale-95"
        style={{
          top: `${display.top}px`,
          left: `${display.left}px`,
          width: `${display.width}px`,
          height: `${display.height}px`,
          zIndex: display.zIndex,
        }}
        title={`Step ${stepId} (${status})`}
      >
        <img
          src={display.src}
          alt={`Step ${stepId} ${status}`}
          className={display.className}
        />
      </div>
    );
  };

  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: "390px",
        height: `${WORLD_STAGE_HEIGHT}px`,
      }}
    >
      {/* Background Decorative SVGs */}
      {DECORATION_CONFIGS.map((dec) => (
        <img
          key={dec.id}
          src={dec.src}
          alt=""
          aria-hidden
          className="pointer-events-none absolute z-2 select-none"
          style={{
            top: `${dec.top}px`,
            ...(dec.left !== undefined ? { left: `${dec.left}px` } : {}),
            ...(dec.right !== undefined ? { right: `${dec.right}px` } : {}),
            width: `${dec.width}px`,
            opacity: dec.opacity,
            ...(dec.rotate || dec.mirrored
              ? { transform: `${dec.mirrored ? "scaleX(-1) " : ""}${dec.rotate ? `rotate(${dec.rotate}deg)` : ""}` }
              : {}),
          }}
        />
      ))}

      {/* Entry gate: the road runs into it. It is scenery, not a level, so it is not a tap target. */}
      <div
        className="pointer-events-none absolute z-10 select-none"
        style={{ top: `${GATE.top}px`, left: `${GATE.left}px`, width: `${GATE.width}px`, height: `${GATE.height}px` }}
      >
        <img
          src={GATE.src}
          alt={GATE.alt}
          className="h-full w-full object-contain drop-shadow-[0_10px_20px_rgba(0,225,255,0.12)]"
        />
        <img
          src={GATE.roof.src}
          alt=""
          aria-hidden
          className="absolute"
          style={{
            top: `${GATE.roof.dy}px`,
            left: `${GATE.roof.dx}px`,
            width: `${GATE.roof.width}px`,
            height: `${GATE.roof.height}px`,
          }}
        />
      </div>

      {/* Roads: the gate to level 1, then each level to the next */}
      {ROAD_CONFIGS.map((road) => (
        <img
          key={road.id}
          src="/images/level-platfrom/Group 287.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute z-5 w-[179px] select-none"
          style={{
            top: `${road.top}px`,
            left: `${road.left}px`,
            ...(road.mirrored ? { transform: "scaleX(-1)" } : {}),
          }}
        />
      ))}

      {/* Buildings beside the first levels' tiles, each with its icon on the roof */}
      {BUILDING_CONFIGS.map((b) => (
        <div
          key={b.id}
          className="pointer-events-none absolute z-25 select-none"
          style={{
            top: `${b.top}px`,
            left: `${b.left}px`,
            width: `${b.width}px`,
            height: `${b.height}px`,
          }}
        >
          <img src={b.src} alt={b.alt} className="h-full w-full object-contain" />
          <img
            src={b.roof.src}
            alt=""
            aria-hidden
            className="absolute"
            style={{
              top: `${b.roof.dy}px`,
              left: `${b.roof.dx}px`,
              width: `${b.roof.width}px`,
              height: `${b.roof.height}px`,
            }}
          />
        </div>
      ))}

      {/* Platforms 1 to 20 */}
      {PLATFORM_CONFIGS.map((p) => renderPlatform(p.id))}

      {/* Final Road continuing off bottom - half visible only, cleanly clipped at bottom */}
      <div
        className="pointer-events-none absolute z-5 overflow-hidden select-none"
        style={{
          top: `${FINAL_ROAD.top}px`,
          left: `${FINAL_ROAD.left}px`,
          width: "179px",
          height: `${FINAL_ROAD.height}px`,
        }}
      >
        <img
          src="/images/level-platfrom/Group 287.svg"
          alt=""
          aria-hidden
          className="w-[179px] select-none"
          style={FINAL_ROAD.mirrored ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>

      {/* Level Start Popup anchored exactly to the clicked platform */}
      <AnimatePresence>
        {selectedLevel !== null && (() => {
          const getAnchor = (level: number) => {
            const config = PLATFORM_CONFIGS.find((p) => p.id === level) || PLATFORM_CONFIGS[0];
            const isTop = config.placement === "top";
            return {
              cx: config.baseX,
              cy: isTop ? config.baseY - 65 : config.baseY,
              placement: config.placement,
              offset: isTop ? 2 : 4,
            };
          };
          const anchor = getAnchor(selectedLevel);
          return (
            <LevelStartPopup
              cx={anchor.cx}
              cy={anchor.cy}
              placement={anchor.placement}
              offset={anchor.offset}
              stageWidth={390}
              title={selectedLessonData.title}
              xp={selectedLessonData.xp}
              onStart={() => onStartLesson(selectedLevel)}
              onClose={onClosePopup}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

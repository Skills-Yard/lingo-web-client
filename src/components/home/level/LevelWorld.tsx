"use client";

import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import {
  BUILDING_CONFIGS,
  computeFinalRoad,
  computeRoadConfigs,
  computeStageHeight,
  DECORATION_CONFIGS,
  FINAL_ROAD,
  GATE,
  getPlatformDisplay,
  PLATFORM_CONFIGS,
  ROAD_CONFIGS,
  ROAD_SETTINGS,
  RoadSettings,
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
  roadSettings?: RoadSettings;
  theme?: "light" | "dark";
}

export function LevelWorld({
  modulesCompleted,
  activeLevelNumber,
  selectedLevel,
  onLevelClick,
  onStartLesson,
  onClosePopup,
  roadSettings,
  theme: propTheme,
}: LevelWorldProps) {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme ?? contextTheme;
  const isDark = theme === "dark";

  const roads = roadSettings ? computeRoadConfigs(roadSettings) : ROAD_CONFIGS;
  const finalRoad = roadSettings ? computeFinalRoad(roadSettings) : FINAL_ROAD;
  const stageHeight = roadSettings ? computeStageHeight(roadSettings) : WORLD_STAGE_HEIGHT;
  const roadWidth = roadSettings?.width ?? ROAD_SETTINGS.width;

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
    const display = getPlatformDisplay(
      status,
      config.baseX,
      config.baseY,
      config.side,
      roadSettings ?? ROAD_SETTINGS,
      isDark
    );

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
        height: `${stageHeight}px`,
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
      </div>

      {/* Roads: the gate to level 1, then each level to the next */}
      {roads.map((road) => (
        <img
          key={road.id}
          src={isDark ? "/images/level-platfrom/dark-theme-road.svg" : "/images/level-platfrom/grid-road.svg"}
          alt=""
          aria-hidden
          className="pointer-events-none absolute z-5 select-none"
          style={{
            top: `${road.top}px`,
            left: `${road.left}px`,
            width: `${road.width ?? roadWidth}px`,
            ...(road.mirrored ? { transform: "scaleX(-1)" } : {}),
          }}
        />
      ))}

      {/* Buildings beside the first levels' tiles, each with its icon on the roof; tapping one is tapping its level.
          They sit a layer behind the roads (z-5) and the tiles (z-20+), above only the scenery (z-2). */}
      {BUILDING_CONFIGS.map((b) => (
        <div
          key={b.id}
          role="button"
          aria-label={b.alt}
          onClick={() => onLevelClick(b.id)}
          className="absolute z-4 cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
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
          top: `${finalRoad.top}px`,
          left: `${finalRoad.left}px`,
          width: `${finalRoad.width ?? roadWidth}px`,
          height: `${finalRoad.height}px`,
        }}
      >
        <img
          src={isDark ? "/images/level-platfrom/dark-theme-road.svg" : "/images/level-platfrom/grid-road.svg"}
          alt=""
          aria-hidden
          className="select-none"
          style={{
            width: `${finalRoad.width ?? roadWidth}px`,
            ...(finalRoad.mirrored ? { transform: "scaleX(-1)" } : {}),
          }}
        />
      </div>

      {/* Level Start Popup anchored exactly to the clicked platform */}
      <AnimatePresence>
        {selectedLevel !== null && (() => {
          const getAnchor = (level: number) => {
            const config = PLATFORM_CONFIGS.find((p) => p.id === level) || PLATFORM_CONFIGS[0];
            const status = getLevelStatus(level);
            const display = getPlatformDisplay(
              status,
              config.baseX,
              config.baseY,
              config.side,
              roadSettings ?? ROAD_SETTINGS,
              isDark
            );
            const isTop = config.placement === "top";
            return {
              cx: Math.round(display.left + display.width / 2),
              cy: isTop ? display.top : display.top + display.height,
              placement: config.placement,
              offset: isTop ? 6 : 6,
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

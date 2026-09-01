import React from "react";
import { Position, Direction } from "./types";
import { demoLevel } from "./levels";

// Ported from lingo-website-client/src/components/programming-basic/demo.tsx

interface DemoPlatformProps {
  playerPos: Position;
  playerDir: Direction;
  isPlaying: boolean;
  executingStep: number | null;
}

const TILE_COORDS: Record<string, { x: number; y: number; width?: string; height?: string }> = {
  "0,0": { x: 31, y: 21, width: "41%", height: "43%" },
  "0,1": { x: 71, y: 21, width: "41%", height: "43%" },
  "1,0": { x: 29, y: 58, width: "43.2%", height: "47.2%" },
  "1,1": { x: 74, y: 58, width: "43.2%", height: "47.2%" },
};

export const DemoPlatform: React.FC<DemoPlatformProps> = ({
  playerPos,
  playerDir,
  isPlaying: _isPlaying,
  executingStep: _executingStep,
}) => {
  const dims = demoLevel.dimensions;

  const getTileConfig = (r: number, c: number) => {
    return TILE_COORDS[`${r},${c}`] || { x: 50, y: 50 };
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-full px-3 py-0.5 mb-1 select-none">
        <span className="text-amber-600 text-[10px] font-black uppercase tracking-widest">🎓 Practice Level</span>
      </div>
      <div
        className="relative select-none animate-fade-in"
        style={{
          width: dims.platformWidth,
          height: dims.platformHeight,
        }}
      >
        {/* Game Platform Background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/platformlayers/2layer-platform.webp"
          alt="Game Platform"
          className="w-full h-full object-contain transition-all duration-500"
          draggable={false}
        />

        {/* Render dynamic Flag item */}
        {(() => {
          const tile = getTileConfig(demoLevel.flagPos.r, demoLevel.flagPos.c);
          return (
            <div
              className="absolute z-10 transition-all duration-300"
              style={{
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                width: dims.flagWidth,
                transform: dims.flagTransform,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/red-flag.webp"
                alt="Flag"
                className="w-full h-14 object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
                style={{ filter: "url(#chroma-white)" }}
              />
            </div>
          );
        })()}

        {/* Render Obstacles (Rocks/Trees) */}
        {demoLevel.obstacles.map((obs, idx) => {
          const tile = getTileConfig(obs.r, obs.c);
          return (
            <div
              key={idx}
              className="absolute z-20"
              style={{
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                width: dims.obstacleWidth,
                transform: obs.type === "rock" ? dims.obstacleRockTransform : dims.obstacleTreeTransform,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={obs.type === "rock" ? "/images/rock.png" : "/images/tree.png"}
                alt={obs.type}
                className="w-full h-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]"
                style={{ filter: "url(#chroma-white)" }}
              />
            </div>
          );
        })}

        {/* Player Lumi */}
        {(() => {
          const tile = getTileConfig(playerPos.r, playerPos.c);
          return (
            <div
              className="absolute z-30 transition-all duration-500 ease-out flex flex-col items-center overflow-visible"
              style={{
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                width: dims.playerWidth,
                transform: dims.playerTransform,
              }}
            >
              {/* Direction indicator (only for main levels) */}
              <div
                className="absolute bottom-0 left-1/2 w-12 h-12 rounded-full border border-white/50 bg-[#fbbf24]  flex items-center justify-center  transition-transform drop-shadow-[0_5px_6px_rgb(251,191,36)] duration-300 z-0"
                style={{
                  transform: `translate(-50%, 50%) scaleY(0.5) rotate(${
                    playerDir === "up" ? -90 : playerDir === "right" ? 0 : playerDir === "down" ? 90 : 180
                  }deg)`,
                }}
              >
                <span className="text-white text-[12px] font-black leading-none">➔</span>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/running-lumi.webp"
                alt="Lumi"
                className="w-full h-auto object-contain drop-shadow-[0_5px_6px_rgba(0,0,0,0.3)]  z-10"
                style={{ filter: "url(#chroma-white)" }}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
};

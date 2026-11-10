/*
 * Layout of the level path, in the 390px-wide stage. The numbers come from the
 * Figma frame "Path2" (docs/path-figma.txt), moved up by the frame's header
 * (160px) so the stage starts under the tabs.
 */

const ART = "/images/level-platfrom";

export interface PlatformConfig {
  id: number;
  /** Horizontal centre of the tile. */
  baseX: number;
  /** Bottom of the tile, where the start popup points. */
  baseY: number;
  title: string;
  xp: number;
  placement: "top" | "bottom";
}

type TileSide = "left" | "right";

const COLUMN_X: Record<TileSide, number> = { left: 117, right: 273 };
const FIRST_TILE_CENTER_Y = 250;
const TILE_STEP_Y = 122.45;
/** A tile's bottom edge sits this far below its centre. */
const TILE_HALF_HEIGHT = 34;

/** Levels alternate down the road, starting on the left under the gate. */
const sideOfLevel = (id: number): TileSide => (id % 2 === 1 ? "left" : "right");

const tileCenterY = (id: number) => FIRST_TILE_CENTER_Y + TILE_STEP_Y * (id - 1);

const LEVELS: { title: string; placement?: PlatformConfig["placement"] }[] = [
  { title: "Commands" },
  { title: "Sequence" },
  { title: "Variable" },
  { title: "Data Types" },
  { title: "Operators" },
  { title: "Conditions" },
  { title: "Variable Types & Type Casting" },
  { title: "String Manipulation & Slicing" },
  { title: "String Methods & Formatting" },
  { title: "Lists & Indexing Fundamentals" },
  { title: "List Methods & Operations" },
  { title: "Tuples & Immutability" },
  { title: "Dictionaries & Key-Value Pairs" },
  { title: "Sets & Set Operations" },
  { title: "If, Elif & Else Conditions" },
  { title: "While Loops & Sentinels" },
  { title: "For Loops & Range Function" },
  { title: "Loop Controls (break, continue)" },
  { title: "Defining Functions & Parameters", placement: "top" },
  { title: "Return Values & Scope", placement: "top" },
];

export const PLATFORM_CONFIGS: PlatformConfig[] = LEVELS.map(({ title, placement }, index) => {
  const id = index + 1;
  return {
    id,
    baseX: COLUMN_X[sideOfLevel(id)],
    baseY: Math.round(tileCenterY(id) + TILE_HALF_HEIGHT),
    title,
    xp: 50,
    placement: placement ?? "bottom",
  };
});

/** The last tile's road runs on past it, cut off by the bottom of the stage. */
const FINAL_ROAD_VISIBLE_HEIGHT = 54;

export interface RoadConfig {
  id: number;
  top: number;
  left: number;
  mirrored: boolean;
}

/** `Group 287.svg` is 179px wide and runs from one tile to the next; it is mirrored when it heads right. */
const ROAD_LEFT = { unmirrored: 99, mirrored: 117.5 } as const;
const ROAD_OFFSET_BELOW_TILE_CENTER = 2;

const roadLeavingLevel = (id: number): RoadConfig => {
  const mirrored = sideOfLevel(id) === "left";
  return {
    id,
    top: Math.round(tileCenterY(id) + ROAD_OFFSET_BELOW_TILE_CENTER),
    left: mirrored ? ROAD_LEFT.mirrored : ROAD_LEFT.unmirrored,
    mirrored,
  };
};

/** The gate is not a level: its road just runs from the gate down to level 1. */
const GATE_ROAD: RoadConfig = { id: 0, top: 136, left: 94, mirrored: false };

/** Roads 0 (gate to level 1) to 19 (level 19 to level 20). */
export const ROAD_CONFIGS: RoadConfig[] = [
  GATE_ROAD,
  ...LEVELS.slice(0, -1).map((_, index) => roadLeavingLevel(index + 1)),
];

const finalRoad = roadLeavingLevel(LEVELS.length);

export const FINAL_ROAD = {
  top: finalRoad.top,
  left: finalRoad.left,
  mirrored: finalRoad.mirrored,
  height: FINAL_ROAD_VISIBLE_HEIGHT,
};

export const WORLD_STAGE_HEIGHT = FINAL_ROAD.top + FINAL_ROAD_VISIBLE_HEIGHT + 4;

type RoofIcon = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Where its corner sits on the building's image. */
  dx: number;
  dy: number;
};

const roofIcon = (file: string, alt: string, width: number, height: number, dx: number, dy: number): RoofIcon => ({
  src: `${ART}/Icon_Roof/${file}`,
  alt,
  width,
  height,
  dx,
  dy,
});

/** Entry gate (`Gate/Entry_Gate.svg`): scenery at the top of the road, never a tap target. */
export const GATE = {
  src: `${ART}/Gate/Entry_Gate.svg`,
  alt: "Entry gate",
  left: 215,
  top: 48,
  width: 124,
  height: 125,
};

/** The roof icon each level's building carries; levels without one have no building yet. */
const ROOF_ICONS: { level: number; roof: RoofIcon }[] = [
  { level: 1, roof: roofIcon("Icon_Roof_Command.svg", "Commands", 77, 47, 6.4, 4.5) },
  { level: 2, roof: roofIcon("Icon_Roof_Sequence.svg", "Sequence", 70, 47, 21, 6) },
  { level: 3, roof: roofIcon("Icon_Roof_Variables.svg", "Variables", 77, 47, 6.4, 4.5) },
  { level: 4, roof: roofIcon("Icon_Roof_DataTypes.svg", "Data Types", 71, 47, 20, 5) },
  { level: 5, roof: roofIcon("Icon_Roof_Operators.svg", "Operators", 61, 38, 14.1, 8) },
];

/** The two building shells; `dx`/`dy` place one beside its tile, from the tile's centre. */
const BUILDING_ART: Record<TileSide, { src: string; width: number; height: number; dx: number; dy: number }> = {
  left: { src: `${ART}/Building/Left_Building.png`, width: 91, height: 88, dx: -102, dy: -100 },
  right: { src: `${ART}/Building/Right_Building.svg`, width: 105, height: 99, dx: 5, dy: -109 },
};

export interface BuildingConfig {
  id: number;
  side: TileSide;
  top: number;
  left: number;
  width: number;
  height: number;
  src: string;
  alt: string;
  roof: RoofIcon;
}

export const BUILDING_CONFIGS: BuildingConfig[] = ROOF_ICONS.map(({ level, roof }) => {
  const side = sideOfLevel(level);
  const art = BUILDING_ART[side];
  return {
    id: level,
    side,
    top: Math.round(tileCenterY(level) + art.dy),
    left: Math.round(COLUMN_X[side] + art.dx),
    width: art.width,
    height: art.height,
    src: art.src,
    alt: roof.alt,
    roof,
  };
});

export interface DecorationConfig {
  id: number;
  top: number;
  left?: number;
  right?: number;
  width: number;
  opacity: number;
  src: string;
  rotate?: number;
  mirrored?: boolean;
}

const CUBE = `${ART}/Icy Isometric Platform and Cube 4.svg`;
const CHIP = `${ART}/image 445.svg`;
const RAIL = `${ART}/image 446.svg`;
const PLANT = `${ART}/image 447.svg`;

/** One run of scenery down the side of the road, as in Figma; it repeats down the path. */
const DECORATION_RUN: Omit<DecorationConfig, "id">[] = [
  { top: 35, left: -70, width: 126, opacity: 0.80, src: CUBE, rotate: -1.94 },
  { top: 115, right: -82, width: 164, opacity: 0.60, src: CHIP },
  { top: 391, left: 320, width: 109, opacity: 0.60, src: PLANT, mirrored: true },
  { top: 502, left: -37, width: 168, opacity: 0.50, src: RAIL },
  { top: 630, left: 315, width: 131, opacity: 0.80, src: CUBE },
];
const DECORATION_RUN_LENGTH = 960;

/** The cube peeking out under the tabs at the very top. */
const TOP_CUBE: Omit<DecorationConfig, "id"> = { top: -69, left: 325, width: 164, opacity: 0.85, src: CUBE, rotate: -1.94 };

export const DECORATION_CONFIGS: DecorationConfig[] = [
  TOP_CUBE,
  ...Array.from({ length: Math.ceil(WORLD_STAGE_HEIGHT / DECORATION_RUN_LENGTH) }, (_, run) =>
    DECORATION_RUN.map((piece) => ({ ...piece, top: piece.top + run * DECORATION_RUN_LENGTH })),
  ).flat(),
]
  .filter((piece) => piece.top < WORLD_STAGE_HEIGHT - 60)
  .map((piece, index) => ({ ...piece, id: index + 1 }));

export function getPlatformDisplay(
  status: "completed" | "active" | "locked",
  baseX: number,
  baseY: number
) {
  if (status === "active") {
    return {
      src: `${ART}/Group 316.svg`,
      alt: "Active Level",
      left: Math.round(baseX - 31),
      top: Math.round(baseY - 106.1),
      width: 75,
      height: 130,
      className: "relative z-10 h-full w-full object-contain",
      zIndex: 22,
    };
  }
  if (status === "completed") {
    return {
      src: `${ART}/Group 315.svg`,
      alt: "Completed Level",
      left: Math.round(baseX - 34),
      top: Math.round(baseY - 96),
      width: 75,
      height: 130,
      className: "h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(5,156,128,0.3)]",
      zIndex: 20,
    };
  }
  return {
    src: `${ART}/Group 318.svg`,
    alt: "Locked Level",
    left: Math.round(baseX - 35),
    top: Math.round(baseY - 100),
    width: 75,
    height: 130,
    className: "h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(119,119,198,0.22)]",
    zIndex: 20,
  };
}

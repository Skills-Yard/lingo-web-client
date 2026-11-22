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
  side: TileSide;
}

type TileSide = "left" | "right";

/**
 * How far the whole path (tiles, roads, buildings, gate) is moved right so it sits in the middle of the 390px stage. As the
 * Figma frame has it the tiles and roads cover x 65 to 317 (measured 2026-11-19 on the page), a middle of 191 against the
 * stage's 195, which left the first building touching the stage's left edge (cut 1.3px) and a gap at the right. The stage itself
 * is centred on the screen at every width (`HomeScreen`), so this is the only thing off centre. The scenery behind is not moved.
 */
export const PATH_SHIFT_X = 4;

const COLUMN_X: Record<TileSide, number> = { left: 117 + PATH_SHIFT_X, right: 273 + PATH_SHIFT_X };
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
  const side = sideOfLevel(id);
  return {
    id,
    baseX: COLUMN_X[side],
    baseY: Math.round(tileCenterY(id) + TILE_HALF_HEIGHT),
    title,
    xp: 50,
    placement: placement ?? "bottom",
    side,
  };
});

/** The last tile's road runs on past it, cut off by the bottom of the stage. */
const FINAL_ROAD_VISIBLE_HEIGHT = 54;

export interface Point {
  x: number;
  y: number;
}

export interface RoadConfig {
  id: number;
  /** The old image's box (`grid-road.svg`, still the dark theme's road) and how it is turned. */
  top: number;
  left: number;
  mirrored: boolean;
  width?: number;
  /** Where the middle of the road's two ends go (upper, lower), for the road artboard (see `RoadArt`). */
  from: Point;
  to: Point;
}

export interface RoadSettings {
  /** Width in px of each 3D road segment. */
  width: number;
  /** Vertical offset in px relative to tile center. */
  offsetY: number;
  /** Horizontal position (left in px) for left-to-right roads (mirrored). */
  mirroredLeft: number;
  /** Horizontal position (left in px) for right-to-left roads (unmirrored). */
  unmirroredLeft: number;
  /** Gate road vertical position (top in px). */
  gateTop: number;
  /** Gate road horizontal position (left in px). */
  gateLeft: number;
  /** Separate offset X for all right-side cubes. */
  rightCubeDx: number;
  /** Separate offset Y for all right-side cubes. */
  rightCubeDy: number;
  /** Separate offset X for all left-side cubes. */
  leftCubeDx: number;
  /** Separate offset Y for all left-side cubes. */
  leftCubeDy: number;
}

/**
 * Global Road Settings:
 * Easily tune road positions here. These settings apply consistently
 * across all levels (Level 1 to Level 20).
 */
export const ROAD_SETTINGS: RoadSettings = {
  width: 184,
  offsetY: 2,
  mirroredLeft: 98 + PATH_SHIFT_X,
  unmirroredLeft: 98 + PATH_SHIFT_X,
  gateTop: 133,
  gateLeft: 101 + PATH_SHIFT_X,
  rightCubeDx: 18,
  rightCubeDy: 0,
  leftCubeDx: -6,
  leftCubeDy: -1,
};

/**
 * Where the middle of a tile's top face is, from the tile's box (72x60, `getPlatformDisplay`): the cube art is 72x54 and sits
 * centred in it, its top face a diamond 72 wide and 43.26 tall (half a side is 21px along the road).
 */
const TILE_FACE = { x: 36, y: 3 + 21.63 };
/** How far in from a tile's middle (px, along the road) the road's end goes: far enough under the tile that its end never shows, with the top face being 21px to its edge. */
const ROAD_END_INSET = 14;

/** The middle of the top face of level `id`'s tile; also for the level after the last, where the final road is headed. */
function tileTopCenter(id: number, settings: RoadSettings): Point {
  const side = sideOfLevel(id);
  const box = getPlatformDisplay("completed", COLUMN_X[side], Math.round(tileCenterY(id) + TILE_HALF_HEIGHT), side, settings);
  return { x: box.left + TILE_FACE.x, y: box.top + TILE_FACE.y };
}

/** The points the road's two ends go to, `ROAD_END_INSET` in from `a` and `b` (each end of the road is hidden under its tile). */
function roadEnds(a: Point, b: Point): { from: Point; to: Point } {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  return {
    from: { x: a.x + ux * ROAD_END_INSET, y: a.y + uy * ROAD_END_INSET },
    to: { x: b.x - ux * ROAD_END_INSET, y: b.y - uy * ROAD_END_INSET },
  };
}

export const roadLeavingLevel = (id: number, settings: RoadSettings = ROAD_SETTINGS): RoadConfig => {
  const mirrored = sideOfLevel(id) === "left";
  return {
    id,
    top: Math.round(tileCenterY(id) + settings.offsetY),
    left: mirrored ? settings.mirroredLeft : settings.unmirroredLeft,
    mirrored,
    width: settings.width,
    ...roadEnds(tileTopCenter(id, settings), tileTopCenter(id + 1, settings)),
  };
};

export const computeRoadConfigs = (settings: RoadSettings = ROAD_SETTINGS): RoadConfig[] => {
  // The upper end is where the old image had it (its slab's upper end is centred at 169.56, 8.5), under the gate; the lower end is in the first tile.
  const gateEnd = { x: settings.gateLeft + 169.56, y: settings.gateTop + 8.5 };
  const gateRoad: RoadConfig = {
    id: 0,
    top: settings.gateTop,
    left: settings.gateLeft,
    mirrored: false,
    width: settings.width,
    from: gateEnd,
    to: roadEnds(gateEnd, tileTopCenter(1, settings)).to,
  };
  return [
    gateRoad,
    ...LEVELS.slice(0, -1).map((_, index) => roadLeavingLevel(index + 1, settings)),
  ];
};

export const computeFinalRoad = (settings: RoadSettings = ROAD_SETTINGS) => {
  const final = roadLeavingLevel(LEVELS.length, settings);
  return {
    top: final.top,
    left: final.left,
    mirrored: final.mirrored,
    height: FINAL_ROAD_VISIBLE_HEIGHT,
    width: settings.width,
    from: final.from,
    to: final.to,
  };
};

export const computeStageHeight = (settings: RoadSettings = ROAD_SETTINGS) => {
  const final = computeFinalRoad(settings);
  return final.top + final.height + 4;
};

/** Default roads 0 (gate to level 1) to 19 (level 19 to level 20). */
export const ROAD_CONFIGS: RoadConfig[] = computeRoadConfigs(ROAD_SETTINGS);

export const FINAL_ROAD = computeFinalRoad(ROAD_SETTINGS);

export const WORLD_STAGE_HEIGHT = computeStageHeight(ROAD_SETTINGS);

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
  left: 226 + PATH_SHIFT_X,
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
  left: { src: `${ART}/Building/Left_Building.png`, width: 91, height: 88, dx: -120, dy: -90 },
  right: { src: `${ART}/Building/Right_Building.svg`, width: 105, height: 99, dx: 10, dy: -100 },
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
  baseY: number,
  side: TileSide = "left",
  settings: RoadSettings = ROAD_SETTINGS,
  themeOrIsDark: "light" | "dark" | boolean = false
) {
  const isDark = typeof themeOrIsDark === "boolean" ? themeOrIsDark : themeOrIsDark === "dark";
  const dx = side === "right" ? (settings.rightCubeDx ?? 0) : (settings.leftCubeDx ?? 0);
  const dy = side === "right" ? (settings.rightCubeDy ?? 0) : (settings.leftCubeDy ?? 0);

  const common = {
    left: Math.round(baseX - 46 + dx),
    top: Math.round(baseY - 64 + dy),
    width: 72,
    height: 60,
  };

  if (status === "active") {
    return {
      src: `${ART}/progress-cube.svg`,
      alt: "Active Level",
      ...common,
      className: "relative z-10 h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(242,193,78,0.4)]",
      zIndex: 22,
    };
  }
  if (status === "completed") {
    return {
      src: `${ART}/check-cube.svg`,
      alt: "Completed Level",
      ...common,
      className: "h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(40,174,139,0.35)]",
      zIndex: 20,
    };
  }
  if (isDark) {
    return {
      src: `${ART}/dark-theme-locked-cube.svg`,
      alt: "Locked Level",
      left: Math.round(baseX - 65 + dx),
      top: Math.round(baseY - 71 + dy),
      width: 110,
      height: 63,
      className: "h-full w-full object-contain drop-shadow-[0_4px_16px_rgba(79,216,232,0.15)]",
      zIndex: 20,
    };
  }
  return {
    src: `${ART}/locked-cube.svg`,
    alt: "Locked Level",
    ...common,
    className: "h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(119,119,198,0.22)]",
    zIndex: 20,
  };
}

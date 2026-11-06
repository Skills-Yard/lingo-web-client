export interface PlatformConfig {
  id: number;
  baseX: number;
  baseY: number;
  title: string;
  xp: number;
  placement: "top" | "bottom";
}

export const WORLD_STAGE_HEIGHT = 2270;

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  { id: 1, baseX: 281, baseY: 166, title: "Arithmetic Operations (+, -, *, /)", xp: 50, placement: "bottom" },
  { id: 2, baseX: 134, baseY: 281, title: "Assignment & Math Expressions", xp: 50, placement: "bottom" },
  { id: 3, baseX: 276, baseY: 390, title: "Comparison Operators (==, !=, <, >)", xp: 50, placement: "bottom" },
  { id: 4, baseX: 126, baseY: 503, title: "Logical Operators (and, or, not)", xp: 50, placement: "bottom" },
  { id: 5, baseX: 266, baseY: 613, title: "Membership Operators (in, not in)", xp: 50, placement: "bottom" },
  { id: 6, baseX: 122, baseY: 721, title: "Identity & Bitwise Operators", xp: 50, placement: "bottom" },
  { id: 7, baseX: 270, baseY: 831, title: "Variable Types & Type Casting", xp: 50, placement: "bottom" },
  { id: 8, baseX: 126, baseY: 941, title: "String Manipulation & Slicing", xp: 50, placement: "bottom" },
  { id: 9, baseX: 272, baseY: 1051, title: "String Methods & Formatting", xp: 50, placement: "bottom" },
  { id: 10, baseX: 124, baseY: 1161, title: "Lists & Indexing Fundamentals", xp: 50, placement: "bottom" },
  { id: 11, baseX: 270, baseY: 1271, title: "List Methods & Operations", xp: 50, placement: "bottom" },
  { id: 12, baseX: 126, baseY: 1381, title: "Tuples & Immutability", xp: 50, placement: "bottom" },
  { id: 13, baseX: 272, baseY: 1491, title: "Dictionaries & Key-Value Pairs", xp: 50, placement: "bottom" },
  { id: 14, baseX: 124, baseY: 1601, title: "Sets & Set Operations", xp: 50, placement: "bottom" },
  { id: 15, baseX: 270, baseY: 1711, title: "If, Elif & Else Conditions", xp: 50, placement: "bottom" },
  { id: 16, baseX: 126, baseY: 1821, title: "While Loops & Sentinels", xp: 50, placement: "bottom" },
  { id: 17, baseX: 272, baseY: 1931, title: "For Loops & Range Function", xp: 50, placement: "bottom" },
  { id: 18, baseX: 124, baseY: 2041, title: "Loop Controls (break, continue)", xp: 50, placement: "bottom" },
  { id: 19, baseX: 270, baseY: 2151, title: "Defining Functions & Parameters", xp: 50, placement: "top" },
  { id: 20, baseX: 124, baseY: 2261, title: "Return Values & Scope", xp: 50, placement: "top" },
];

export interface RoadConfig {
  id: number;
  top: number;
  left: number;
  mirrored: boolean;
}

export const ROAD_CONFIGS: RoadConfig[] = [
  { id: 1, top: 110, left: 120, mirrored: false },
  { id: 2, top: 228, left: 100, mirrored: true },
  { id: 3, top: 346, left: 98, mirrored: false },
  { id: 4, top: 453, left: 99, mirrored: true },
  { id: 5, top: 565, left: 98, mirrored: false },
  { id: 6, top: 676, left: 99, mirrored: true },
  { id: 7, top: 786, left: 98, mirrored: false },
  { id: 8, top: 896, left: 99, mirrored: true },
  { id: 9, top: 1006, left: 98, mirrored: false },
  { id: 10, top: 1116, left: 99, mirrored: true },
  { id: 11, top: 1226, left: 98, mirrored: false },
  { id: 12, top: 1336, left: 99, mirrored: true },
  { id: 13, top: 1446, left: 98, mirrored: false },
  { id: 14, top: 1556, left: 99, mirrored: true },
  { id: 15, top: 1666, left: 98, mirrored: false },
  { id: 16, top: 1776, left: 99, mirrored: true },
  { id: 17, top: 1886, left: 98, mirrored: false },
  { id: 18, top: 1996, left: 99, mirrored: true },
  { id: 19, top: 2106, left: 98, mirrored: false },
];

export const FINAL_ROAD = {
  top: 2216,
  left: 99,
};

export interface BuildingConfig {
  id: number;
  nearLevel: number;
  side: "left" | "right";
  top: number;
  left: number;
  width: number;
  height: number;
  src: string;
  alt: string;
}

export const BUILDING_CONFIGS: BuildingConfig[] = [
  { id: 1, nearLevel: 2, side: "left", top: 150, left: 15, width: 98, height: 88, src: "/images/level-platfrom/Group 305.svg", alt: "Arithmetic Operators" },
  { id: 2, nearLevel: 3, side: "right", top: 255, left: 290, width: 105, height: 99, src: "/images/level-platfrom/Group 311.svg", alt: "Comparison Operators" },
  { id: 3, nearLevel: 4, side: "left", top: 375, left: 5, width: 91, height: 88, src: "/images/level-platfrom/Group 317.svg", alt: "Logical Operators" },
  { id: 4, nearLevel: 5, side: "right", top: 475, left: 279, width: 106, height: 99, src: "/images/level-platfrom/Group 312.svg", alt: "Membership Operators" },
  { id: 5, nearLevel: 6, side: "left", top: 591, left: 15, width: 98, height: 88, src: "/images/level-platfrom/Group 305.svg", alt: "Arithmetic Operators" },
  { id: 6, nearLevel: 7, side: "right", top: 696, left: 290, width: 105, height: 99, src: "/images/level-platfrom/Group 311.svg", alt: "Comparison Operators" },
  { id: 7, nearLevel: 8, side: "left", top: 813, left: 5, width: 91, height: 88, src: "/images/level-platfrom/Group 317.svg", alt: "Logical Operators" },
  { id: 8, nearLevel: 9, side: "right", top: 913, left: 279, width: 106, height: 99, src: "/images/level-platfrom/Group 312.svg", alt: "Membership Operators" },
  { id: 9, nearLevel: 10, side: "left", top: 1031, left: 15, width: 98, height: 88, src: "/images/level-platfrom/Group 305.svg", alt: "Arithmetic Operators" },
  { id: 10, nearLevel: 11, side: "right", top: 1136, left: 290, width: 105, height: 99, src: "/images/level-platfrom/Group 311.svg", alt: "Comparison Operators" },
  { id: 11, nearLevel: 12, side: "left", top: 1253, left: 5, width: 91, height: 88, src: "/images/level-platfrom/Group 317.svg", alt: "Logical Operators" },
  { id: 12, nearLevel: 13, side: "right", top: 1353, left: 279, width: 106, height: 99, src: "/images/level-platfrom/Group 312.svg", alt: "Membership Operators" },
  { id: 13, nearLevel: 14, side: "left", top: 1471, left: 15, width: 98, height: 88, src: "/images/level-platfrom/Group 305.svg", alt: "Arithmetic Operators" },
  { id: 14, nearLevel: 15, side: "right", top: 1576, left: 290, width: 105, height: 99, src: "/images/level-platfrom/Group 311.svg", alt: "Comparison Operators" },
  { id: 15, nearLevel: 16, side: "left", top: 1693, left: 5, width: 91, height: 88, src: "/images/level-platfrom/Group 317.svg", alt: "Logical Operators" },
  { id: 16, nearLevel: 17, side: "right", top: 1793, left: 279, width: 106, height: 99, src: "/images/level-platfrom/Group 312.svg", alt: "Membership Operators" },
  { id: 17, nearLevel: 18, side: "left", top: 1911, left: 15, width: 98, height: 88, src: "/images/level-platfrom/Group 305.svg", alt: "Arithmetic Operators" },
  { id: 18, nearLevel: 19, side: "right", top: 2016, left: 290, width: 105, height: 99, src: "/images/level-platfrom/Group 311.svg", alt: "Comparison Operators" },
  { id: 19, nearLevel: 20, side: "left", top: 2133, left: 5, width: 91, height: 88, src: "/images/level-platfrom/Group 317.svg", alt: "Logical Operators" },
];

export interface DecorationConfig {
  id: number;
  top: number;
  left?: number;
  right?: number;
  width: number;
  opacity: number;
  src: string;
}

export const DECORATION_CONFIGS: DecorationConfig[] = [
  { id: 1, top: 55, left: -50, width: 115, opacity: 0.85, src: "/images/level-platfrom/Icy Isometric Platform and Cube 4.svg" },
  { id: 2, top: 135, right: -65, width: 155, opacity: 0.75, src: "/images/level-platfrom/image 445.svg" },
  { id: 3, top: 365, left: -20, width: 130, opacity: 0.80, src: "/images/level-platfrom/image 446.svg" },
  { id: 4, top: 585, right: -50, width: 110, opacity: 0.85, src: "/images/level-platfrom/image 447.svg" },
  { id: 5, top: 825, left: -45, width: 120, opacity: 0.75, src: "/images/level-platfrom/Icy Isometric Platform and Cube 4.svg" },
  { id: 6, top: 1045, right: -65, width: 150, opacity: 0.75, src: "/images/level-platfrom/image 445.svg" },
  { id: 7, top: 1265, left: -20, width: 130, opacity: 0.80, src: "/images/level-platfrom/image 446.svg" },
  { id: 8, top: 1485, right: -50, width: 110, opacity: 0.85, src: "/images/level-platfrom/image 447.svg" },
  { id: 9, top: 1725, left: -45, width: 120, opacity: 0.75, src: "/images/level-platfrom/Icy Isometric Platform and Cube 4.svg" },
  { id: 10, top: 1945, right: -65, width: 150, opacity: 0.75, src: "/images/level-platfrom/image 445.svg" },
  { id: 11, top: 2165, left: -20, width: 130, opacity: 0.80, src: "/images/level-platfrom/image 446.svg" },
];

export function getPlatformDisplay(
  status: "completed" | "active" | "locked",
  baseX: number,
  baseY: number
) {
  if (status === "active") {
    return {
      src: "/images/level-platfrom/Group 316.svg",
      alt: "Active Level",
      left: Math.round(baseX - 49.5),
      top: Math.round(baseY - 109.5),
      width: 99,
      height: 113,
      className: "relative z-10 h-full w-full object-contain",
      zIndex: 22,
    };
  }
  if (status === "completed") {
    return {
      src: "/images/level-platfrom/Group 315.svg",
      alt: "Completed Level",
      left: Math.round(baseX - 42),
      top: Math.round(baseY - 71),
      width: 81,
      height: 74,
      className: "h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(5,156,128,0.3)]",
      zIndex: 20,
    };
  }
  return {
    src: "/images/level-platfrom/Group 318.svg",
    alt: "Locked Level",
    left: Math.round(baseX - 41.5),
    top: Math.round(baseY - 71),
    width: 83,
    height: 74,
    className: "h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(119,119,198,0.22)]",
    zIndex: 20,
  };
}

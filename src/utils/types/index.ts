// Self-contained game types for the screen 08 mini-game.
// Ported from lingo-website-client (config/levels + utils/types).

export interface Position {
  r: number;
  c: number;
}

export type Direction = "up" | "right" | "down" | "left";

export interface Obstacle {
  r: number;
  c: number;
  type: "rock" | "tree";
}

export interface GridDimensions {
  platformWidth: string;
  platformHeight: string;
  playerWidth: string;
  flagWidth: string;
  obstacleWidth: string;
  playerTransform: string;
  flagTransform: string;
  obstacleRockTransform: string;
  obstacleTreeTransform: string;
  tileHighlightWidth?: string;
  tileHighlightHeight?: string;
  tileHighlightScaleY: string;
  tileHighlightRadius: string;
}

export interface LevelConfig {
  name: string;
  subtitle: string;
  instructions: string;
  gridCols: number;
  gridRows: number;
  startPos: Position;
  startDir: Direction;
  flagPos: Position;
  obstacles: Obstacle[];
  starPos?: Position;
  maxSlots: number;
  hints: string[];
  isDemo?: boolean;
  dimensions: GridDimensions;
}

export type CommandType = "straight" | "left" | "right" | "pickup" | "back";

export interface CommandInfo {
  type: CommandType;
  label: string;
  imageSrc: string;
}

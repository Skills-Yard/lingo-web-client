import type { MutableRefObject } from "react";

export type Point = {
  x: number;
  y: number;
};

export type PlatformSpec = {
  id: string;
  level: number;
  cx: number;
  cy: number;
};

export type ArtboardFrame = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type BlockController = {
  letsGo: () => void;
  exitLetsGo: () => void;
  startLesson: () => void;
  leave: (trigger: string) => void;
};

export type Launch = {
  current: number;
  enterTrigger: string;
  onLaunch: () => void;
  controllerRef: MutableRefObject<BlockController | null>;
};

export type Side = "left" | "right";

export type CardPlace = {
  y: number;
  scale: number;
  height: number;
  opacity: number;
  zIndex: number;
};


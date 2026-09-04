import { LevelConfig } from "./types";

// Ported from lingo-website-client/src/config/levels/{demo,lesson1}.ts

export const demoLevel: LevelConfig = {
  name: "Demo",
  subtitle: "Welcome! Let's Learn",
  instructions:
    "Hello! 👋 This is a quick practice level. Guide Lumi straight up, then turn right and keep moving straight—the flag is waiting there!",
  gridCols: 2,
  gridRows: 2,
  startPos: { r: 1, c: 0 },
  startDir: "up",
  flagPos: { r: 0, c: 1 },
  obstacles: [{ r: 1, c: 1, type: "rock" }],
  maxSlots: 3,
  hints: ["straight", "right", "straight"],
  isDemo: true,

  dimensions: {
    platformWidth: "240px",
    platformHeight: "200px",
    playerWidth: "25%",
    flagWidth: "16%",
    obstacleWidth: "16%",
    playerTransform: "translate(-57%, -80%)",
    flagTransform: "translate(-35%, -88%)",
    obstacleRockTransform: "translate(-55%, -55%)",
    obstacleTreeTransform: "translate(-50%, -85%)",
    tileHighlightWidth: "43.2%",
    tileHighlightHeight: "47.2%",
    tileHighlightScaleY: "0.83",
    tileHighlightRadius: "9px",
  },
};

export const lesson1Level: LevelConfig = {
  name: "Lesson 1",
  subtitle: "Lumi Commands",
  instructions:
    "Guide Lumi to the flag! Help Lumi navigate straight up and turn right to reach the flag.",
  gridCols: 3,
  gridRows: 3,
  startPos: { r: 2, c: 0 },
  startDir: "up",
  flagPos: { r: 0, c: 2 },
  obstacles: [
    { r: 1, c: 1, type: "rock" },
    { r: 2, c: 1, type: "tree" },
  ],
  maxSlots: 5,
  hints: ["straight", "straight", "right", "straight", "straight"],

  dimensions: {
    platformWidth: "320px",
    platformHeight: "270px",
    playerWidth: "17%",
    flagWidth: "17%",
    obstacleWidth: "13%",
    playerTransform: "translate(-55%, -98%)",
    flagTransform: "translate(-35%, -95%)",
    obstacleRockTransform: "translate(-50%, -50%)",
    obstacleTreeTransform: "translate(-50%, -75%)",
    tileHighlightScaleY: "1",
    tileHighlightRadius: "13px",
  },
};

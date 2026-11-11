import {
  BATTERY,
  BUTTON,
  COMMAND_ROBOT,
  FLIP_CARD,
  HEX_RIVE_SRC,
  LESSON_COMPLETE,
  LEVEL_BACKGROUND,
  MODULE_BUTTON,
  PROGRESS_BAR,
  REWARD_SCREEN,
  SEQUENCE_ROOM,
} from "@/lib/rive/runtime";
import type { ArtboardSource } from "./Artboard";

/**
 * The artboards the app already has, by a name a screen can use as data. Each entry is
 * what `Artboard` needs to draw it. The comment says what it is for and which properties
 * and triggers it understands (set through `properties` / `trigger`).
 */
export const ARTBOARDS = {
  /** The battery. Properties: `level` (0-100), `unlimited`. Triggers: `spend`, `gain`, `fullFlash`. */
  battery: {
    src: BATTERY.src,
    artboard: BATTERY.artboard,
    stateMachine: BATTERY.stateMachine,
    size: { width: BATTERY.width, height: BATTERY.height },
    bleed: BATTERY.bleed,
    darkThemeProperty: BATTERY.darkThemeProperty,
    properties: { [BATTERY.levelProperty]: 100 },
  },
  /** The lesson progress bar. Properties: `progress` (0-100). Triggers: `correct`, `wrong`. */
  "progress-bar": {
    src: PROGRESS_BAR.src,
    artboard: PROGRESS_BAR.artboard,
    stateMachine: PROGRESS_BAR.stateMachine,
    bleed: PROGRESS_BAR.bleed,
    darkThemeProperty: PROGRESS_BAR.darkThemeProperty,
    properties: { [PROGRESS_BAR.property]: 50 },
  },
  /** The big call-to-action button. Properties: `label` (text), `buttonState` (0 disabled, 2 wrong, 3 enabled, 4 light). Triggers: `shine`, `click`. */
  button: {
    src: BUTTON.src,
    artboard: BUTTON.artboard,
    stateMachine: BUTTON.stateMachine,
    size: { width: BUTTON.width, height: BUTTON.height },
    bleed: BUTTON.bleed,
    properties: { [BUTTON.labelProperty]: "Continue", [MODULE_BUTTON.stateProperty]: MODULE_BUTTON.state.enabled },
  },
  /** The card that turns over when tapped (`tapTrigger="Trigger 1"`, or fire `Trigger 1`). It needs its view model bound, or it does not turn. Property: `cardType` (0 the "what a command is" card, 1 the Sequence module's "Why does order matter?"; the current file draws the second whichever is set). */
  "flip-card": {
    src: FLIP_CARD.src,
    artboard: FLIP_CARD.artboard,
    stateMachine: FLIP_CARD.stateMachine,
    size: { width: FLIP_CARD.width, height: FLIP_CARD.height },
    bleed: FLIP_CARD.bleed,
    properties: { [FLIP_CARD.cardTypeProperty]: FLIP_CARD.cardType.order },
  },
  /** The robot arm and its table. Property: `targetLabel` (text on the target box). Triggers: `pickUp`, `putDown`, `placeInTarget`, `reset`, `showHint`, `hideHint`, `wrongClaw`, `wrongCube`. */
  "robot-arm": {
    src: COMMAND_ROBOT.src,
    artboard: COMMAND_ROBOT.artboard,
    stateMachine: COMMAND_ROBOT.stateMachine,
    size: { width: COMMAND_ROBOT.width, height: COMMAND_ROBOT.height },
    darkThemeProperty: COMMAND_ROBOT.darkThemeProperty,
  },
  /** The bedroom. Triggers: `wearSocks`, `wearShoes`, `wearShoesNoSocks`, `shoesThenTrySocks`, `happy`, `reset`. */
  "bedroom-room": {
    src: SEQUENCE_ROOM.src,
    artboard: SEQUENCE_ROOM.artboard,
    stateMachine: SEQUENCE_ROOM.stateMachine,
    size: { width: SEQUENCE_ROOM.width, height: SEQUENCE_ROOM.height },
    darkThemeProperty: SEQUENCE_ROOM.darkProperty,
  },
  /** The gem. */
  gem: { src: "/animations/gem", artboard: "Gem", stateMachine: "State Machine 1", bind: false },
  /** The animated lesson background, made to be repeated down a page. */
  "level-background": {
    src: LEVEL_BACKGROUND.src,
    artboard: LEVEL_BACKGROUND.artboard,
    stateMachine: LEVEL_BACKGROUND.stateMachine,
    size: { width: 390, height: 844 },
  },
  /** The "Lesson complete!" results. Properties: `xp`, `accuracy`, `time` (numbers, or text if the artboard declares them so). Trigger: `play`. */
  "lesson-complete": {
    src: HEX_RIVE_SRC,
    artboard: LESSON_COMPLETE.artboard,
    stateMachine: LESSON_COMPLETE.stateMachine,
    fit: "fitWidth",
  },
  /** The reward chest. Property: `tap` (1, 2, then 3 opens it). */
  "reward-chest": {
    src: HEX_RIVE_SRC,
    artboard: REWARD_SCREEN.chest.artboard,
    stateMachine: REWARD_SCREEN.chest.stateMachine,
  },
  /** The reward screen's looping backdrop. */
  "reward-background": {
    src: HEX_RIVE_SRC,
    artboard: REWARD_SCREEN.background.artboard,
    stateMachine: REWARD_SCREEN.background.stateMachine,
    fit: "cover",
  },
} as const satisfies Record<string, ArtboardSource>;

export type ArtboardName = keyof typeof ARTBOARDS;

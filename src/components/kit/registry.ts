import { createElement, type ComponentProps, type ComponentType, type ReactElement } from "react";
import { LessonArtboard } from "./artboard/LessonArtboard";
import { AudioClip } from "./audio/AudioClip";
import { SoundButton } from "./audio/SoundButton";
import { Voiceover } from "./audio/Voiceover";
import { LessonFooter } from "./buttons/LessonFooter";
import { Celebration } from "./feedback/Celebration";
import { ResultSheet } from "./feedback/ResultSheet";
import { HexGame } from "./game/HexGame";
import { LessonHeader } from "./header/LessonHeader";
import { HexGuide } from "./hex/HexGuide";
import { LessonSlider } from "./inputs/LessonSlider";
import { LessonTextBox } from "./inputs/LessonTextBox";
import { OrderSteps } from "./inputs/OrderSteps";
import { SortGroups } from "./inputs/SortGroups";
import { ScreenFrame } from "./layout/ScreenFrame";
import { Card, Row, Spacer, Stack } from "./layout/Stack";
import { LessonCards } from "./media/LessonCards";
import { Picture } from "./media/Picture";
import { VideoPlayer } from "./media/VideoPlayer";
import { Answers } from "./options/Answers";
import { PickAll } from "./options/PickAll";
import { WordChips } from "./options/WordChips";
import { RewardPopup } from "./reward/RewardPopup";
import { NameValueCard } from "./text/Code";
import { LessonTitle } from "./text/LessonTitle";
import { KeyText } from "./text/Prompt";

/**
 * Every component of the kit by the name a screen's data uses for it. A screen described as
 * data is a tree of `{ type, props, children }` nodes (see `KitNode`); `renderKit` turns it into
 * elements. What the components report (a pick, a press) comes back through their callback props, which
 * whatever runs the screen supplies — plain data cannot hold functions.
 */
export const KIT = {
  // Building blocks
  "screen-frame": ScreenFrame,
  stack: Stack,
  row: Row,
  spacer: Spacer,
  card: Card,
  picture: Picture,
  // On every screen
  "lesson-header": LessonHeader,
  "lesson-footer": LessonFooter,
  "lesson-title": LessonTitle,
  "hex-guide": HexGuide,
  "result-sheet": ResultSheet,
  celebration: Celebration,
  "reward-popup": RewardPopup,
  "sound-button": SoundButton,
  "key-text": KeyText,
  voiceover: Voiceover,
  // Answers and inputs
  answers: Answers,
  "pick-all": PickAll,
  "word-chips": WordChips,
  "lesson-slider": LessonSlider,
  "lesson-text-box": LessonTextBox,
  // Activities
  "order-steps": OrderSteps,
  "sort-groups": SortGroups,
  // Scenes and media
  "lesson-artboard": LessonArtboard,
  "hex-game": HexGame,
  "audio-clip": AudioClip,
  "video-player": VideoPlayer,
  "lesson-cards": LessonCards,
  // Still to merge into LessonCards
  "name-value-card": NameValueCard,
} as const;

export type KitName = keyof typeof KIT;

/** The props of the component named `K`. */
export type KitProps<K extends KitName> = ComponentProps<(typeof KIT)[K]>;

/**
 * One piece of a screen as data: which component, its props, and what stands inside it (for the
 * components that hold others: `stack`, `row`, `card`, `screen-frame`, `voiceover`).
 */
export type KitNode = {
  [K in KitName]: { type: K; children?: KitNode[] } & (object extends KitProps<K> ? { props?: KitProps<K> } : { props: KitProps<K> });
}[KitName];

/** Turns a node (and everything in it) into a React element. */
export function renderKit(node: KitNode, key?: string | number): ReactElement {
  const component = KIT[node.type] as ComponentType<Record<string, unknown>>;
  const children = node.children?.map((child, index) => renderKit(child, index));
  return createElement(component, { key, ...(node.props as Record<string, unknown> | undefined) }, ...(children ?? []));
}

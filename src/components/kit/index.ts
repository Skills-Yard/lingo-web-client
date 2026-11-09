/**
 * The kit: the reusable components every screen is built from (see `docs/kit-components.md`).
 * The data names only these; a screen never adds a component of its own.
 */

export * from "./types";

// On every screen
export { LessonHeader, type LessonHeaderProps } from "./header/LessonHeader";
export { LessonFooter, type LessonFooterProps } from "./buttons/LessonFooter";
export { LessonTitle, type LessonTitleProps } from "./text/LessonTitle";
export { HexGuide, type HexGuideProps } from "./hex/HexGuide";
export { ResultSheet, type ResultSheetProps } from "./feedback/ResultSheet";
export { Celebration } from "./feedback/Celebration";
export { RewardPopup, type RewardPopupProps } from "./reward/RewardPopup";
export { SoundButton } from "./audio/SoundButton";
export { KeyText } from "./text/Prompt";
export { ScreenFrame, ScreenBody, RESULT_LIFT, type ScreenFrameProps, type ScreenBodyProps } from "./layout/ScreenFrame";

// Answers and inputs
export { Answers, type AnswersProps, type AnswersLook } from "./options/Answers";
export { PickAll, type PickAllProps } from "./options/PickAll";
export { WordChips, type WordChipsProps } from "./options/WordChips";
export { LessonSlider, type LessonSliderProps } from "./inputs/LessonSlider";
export { LessonTextBox, type LessonTextBoxProps } from "./inputs/LessonTextBox";

// Activities
export { OrderSteps, type OrderStepsProps, type OrderItem } from "./inputs/OrderSteps";
export { SortGroups, type SortGroupsProps, type SortItem, type SortBucket } from "./inputs/SortGroups";

// Scenes and media
export { LessonArtboard, type LessonArtboardProps } from "./artboard/LessonArtboard";
export { HexGame, type HexGameProps, type GameResult } from "./game/HexGame";
export { AudioClip, type AudioClipProps } from "./audio/AudioClip";
export { VideoPlayer, type VideoPlayerProps } from "./media/VideoPlayer";
export { LessonCards, type LessonCardsProps, type LessonCard } from "./media/LessonCards";

// Building blocks
export { Stack, Row, Spacer, Card } from "./layout/Stack";
export { Picture, type PictureProps } from "./media/Picture";

// Screens as data
export { KIT, renderKit, type KitName, type KitNode, type KitProps } from "./registry";

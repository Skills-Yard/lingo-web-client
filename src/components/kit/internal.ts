/**
 * The screen kit: one component for each thing that stands on a lesson screen, each taking
 * plain data, so a screen can be described as data and put together from these at runtime
 * (see `registry.ts`). `docs/kit.md` lists them all; `/kit` shows them working.
 */

export * from "./types";
export { TINT, TEXT, COLOR } from "./tokens";
export { Markup, parseMarkup, plainText, toSpans } from "./markup";

// Layout
export { ScreenFrame, ScreenBody, RESULT_LIFT, type ScreenFrameProps, type ScreenBodyProps } from "./layout/ScreenFrame";
export { Backdrop, type BackdropKind } from "./layout/Backdrop";
export { Stack, Row, Spacer, Card } from "./layout/Stack";

// LessonHeader
export { LessonHeader, type LessonHeaderProps } from "./header/LessonHeader";
export { CloseButton } from "./header/CloseButton";
export { ProgressBar, type ProgressBarProps } from "./header/ProgressBar";
export { BatteryMeter, type BatteryMeterProps } from "./header/BatteryMeter";

// Text
export { LessonTitle, type LessonTitleProps } from "./text/LessonTitle";
export { Prompt, Note, KeyText } from "./text/Prompt";
export { TipCard, type TipCardProps, type TipTone } from "./text/TipCard";
export { NameValueCard, type NameValueRow } from "./text/Code";

// Hex
export { Hex, type HexProps } from "./hex/Hex";
export { HexGuide, type HexGuideProps } from "./hex/HexGuide";
export { SpeechBubble, type SpeechBubbleProps } from "./hex/SpeechBubble";

// Answers
export { Answers, type AnswersProps, type AnswersLook } from "./options/Answers";
export { OptionRow, type OptionRowProps } from "./options/OptionRow";
export { OptionList, type OptionListProps } from "./options/OptionList";
export { OptionTile, type OptionTileProps, type TileSize } from "./options/OptionTile";
export { OptionGrid, type OptionGridProps, type GridLayout } from "./options/OptionGrid";
export { TrueFalse, type TrueFalseProps } from "./options/TrueFalse";
export { PickAll, type PickAllProps } from "./options/PickAll";
export { WordChips, type WordChipsProps } from "./options/WordChips";
export { OptionObjects, type OptionObjectsProps, type ObjectOption } from "./options/OptionObjects";
export { optionState, multiOptionState } from "./options/state";

// Other inputs
export { LessonSlider, type LessonSliderProps } from "./inputs/LessonSlider";
export { LessonTextBox, type LessonTextBoxProps } from "./inputs/LessonTextBox";
export { OrderSteps, type OrderStepsProps, type OrderItem } from "./inputs/OrderSteps";
export { SortGroups, type SortGroupsProps, type SortItem, type SortBucket } from "./inputs/SortGroups";
export { RevealCards, type RevealCardsProps } from "./inputs/RevealCards";

// Result
export { ResultSheet, type ResultSheetProps } from "./feedback/ResultSheet";
export { AnswerMark } from "./feedback/AnswerMark";
export { Celebration } from "./feedback/Celebration";

// Buttons
export { LessonFooter, type LessonFooterProps } from "./buttons/LessonFooter";
export { PrimaryButton, type PrimaryButtonProps } from "./buttons/PrimaryButton";
export { HintButton, type HintButtonProps } from "./buttons/HintButton";
export { PillButton, type PillButtonProps } from "./buttons/PillButton";

// Artboards
export { Artboard, type ArtboardProps, type ArtboardSource, type ArtboardHandle, type ArtboardFit } from "./artboard/Artboard";
export { LessonArtboard, type LessonArtboardProps } from "./artboard/LessonArtboard";
export { ARTBOARDS, type ArtboardName } from "./artboard/presets";

// Audio
export { AudioClip, type AudioClipProps } from "./audio/AudioClip";
export { Voiceover, type VoiceoverProps } from "./audio/Voiceover";
export { SoundButton } from "./audio/SoundButton";
export * from "./audio/sounds";

// Game
export { HexGame, type HexGameProps, type GameResult } from "./game/HexGame";
export { GameBoard, type GameBoardProps, type Command, type Dir, type HexState } from "./game/GameBoard";
export { MovePad, type MovePadProps, type MoveControl } from "./game/MovePad";
export { ProgramBuilder, type ProgramBuilderProps, type PlanItem } from "./game/ProgramBuilder";
export { CommandCards } from "./game/commands";

// Media
export { Picture, type PictureProps } from "./media/Picture";
export { LessonCards, type LessonCardsProps, type LessonCard } from "./media/LessonCards";
export { VideoPlayer, type VideoPlayerProps } from "./media/VideoPlayer";

// Rewards
export { RewardPopup, type RewardPopupProps } from "./reward/RewardPopup";
export { LessonComplete, type LessonCompleteProps } from "./reward/LessonComplete";

// Screens as data
export { KIT, renderKit, type KitName, type KitNode, type KitProps } from "./registry";

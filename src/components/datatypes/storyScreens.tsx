import { STEP } from "./datatypes";
import type { StoryScreenDef } from "./screen";
import { EventScene, StudentProfileCard } from "./visuals";

/** The screens that tell a story and ask nothing: the module's first two. */
export const STORY_SCREENS: Readonly<Record<number, StoryScreenDef>> = {
  [STEP.eventInfo]: {
    step: STEP.eventInfo,
    title: "Let’s *organise* an event!",
    line: "Imagine your school is organising a special event.",
    backdrop: <EventScene />,
  },

  [STEP.meetAarav]: {
    step: STEP.meetAarav,
    title: "Explore student’s *details!*",
    line: "Meet Aarav! Let’s explore his student profile",
    picture: { node: <StudentProfileCard />, top: 322 },
  },
};

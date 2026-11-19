/** The one text style of the onboarding flow — semibold 17px / 130% in the app
 * font (see lib/fonts), used by every screen's heading and by the speech
 * bubbles, so the screens read as one flow. Alignment is the caller's: left
 * on question screens, centred elsewhere. */
export const ONBOARDING_TEXT_CLASS =
  "text-[17px] font-semibold leading-[1.3] text-[#2C2C2C] dark:text-white";

/** Every onboarding screen's heading — the shared text style, balanced. */
export const ONBOARDING_HEADING_CLASS = `text-balance ${ONBOARDING_TEXT_CLASS}`;

/** The question screens' heading — the same style, at 20px. */
export const ONBOARDING_QUESTION_CLASS = `text-balance text-[20px] font-semibold leading-[1.3] text-[#2C2C2C] dark:text-white`;

/** The gap between the header and a screen's first element (heading or
 * bubble) — the same on every screen, so they all start on one top line. */
export const ONBOARDING_TOP_OFFSET_CLASS = "pt-0";

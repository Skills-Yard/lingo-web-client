import type { ViewModelInstance } from "@rive-app/canvas";
import { BUTTON } from "./runtime";

type ButtonStyle = (typeof BUTTON.style)[keyof typeof BUTTON.style];

/** Picks the look the "AllButton" artboard draws (`switchStyle`): module or onboarding. */
export const writeButtonStyle = (instance: ViewModelInstance, style: ButtonStyle) => {
  const property = instance.number(BUTTON.styleProperty);
  if (property) property.value = style;
  else console.warn(`[button] no "${BUTTON.styleProperty}" number found on the view model`);
};

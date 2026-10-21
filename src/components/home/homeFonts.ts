import { Fredoka, Nunito } from "next/font/google";

/** Body and titles of the home's tabs. */
export const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

/** Headings, counters and button labels. Put `fredoka.variable` on a screen's
 * root, then use `HEADING` where the heading face is wanted. */
export const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-home-fredoka",
});

export const HEADING = "font-[family-name:var(--font-home-fredoka)] font-semibold";

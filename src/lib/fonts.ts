import { Poppins } from "next/font/google";

/**
 * The app's one typeface — the only place a font is chosen.
 *
 * To change the font of the whole app, swap `Poppins` here for another
 * `next/font/google` family (and adjust `weight` to what it ships), keeping
 * `variable: "--font-app"`. Nothing else needs to change: `app/layout.tsx`
 * puts the variable on <html>, `app/globals.css` maps it to Tailwind's
 * `font-sans`, and every component inherits it or uses `font-sans`.
 *
 * Don't call a font loader anywhere else, and don't hard-code a family name.
 */
export const appFont = Poppins({
  variable: "--font-app",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

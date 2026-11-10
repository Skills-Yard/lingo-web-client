# Data Types module: pictures

Every picture on an option or a card is a **stand-in** from the Sequence and Command modules until the module has art of its own. They are all listed in one place, `src/components/datatypes/pictures.ts` (`P`).

To use a real picture, put the file in `public/images/datatypes/` and change that one line (for example `integer: "/images/datatypes/integer.webp"`). The four data types have the same picture wherever they appear, so changing one line changes every screen that shows it.

| Key | Stands in for | Today's stand-in |
|---|---|---|
| `integer` | the Integer type | the blue cube (Command) |
| `float` | the Float type | the coin |
| `string` | the String type, names, text | the "AB" tile (Sequence) |
| `boolean` | the Boolean type, yes/no | the traffic signal |
| `think`, `order`, `actions`, `goal`, `short`, `random`, `repeat`, `unsure` | answers that must not hint at the right one | the Sequence icons |
| `programmer`, `teacher` | a student | the Level 1 illustrations |
| `star`, `gem`, `run`, `rock`, `tree`, `food`, `box`, `computer`, `command`, `idea`, `question`, `statement`, `stop` | tickets, prizes, height, weight, colours, a computer, a switch and so on | the existing icons |

## The module's own art (screens 1 to 6)

Screens 1 ("Let's organise our event!") and 2 ("Meet Aarav!") use real illustrations and their own answer icons, the grouping screen one icon, and screens 5 and 6 a backdrop and card icons, in `public/images/datatypes/` and listed in `P`:

| Key | File | Used by |
|---|---|---|
| `eventScene` | `event-scene.webp` (1170 x 1635, from the 1560 x 2180 PNG) | screen 1: a full-width backdrop behind the title and Hex, fading into the page at its top and foot (`EventScene`) |
| `studentProfile` | `student-profile.webp` (1000 x 547, transparent corners) | screen 2: the student profile card, 300px wide under Hex's line (`StudentProfileCard`) |
| `needName`, `needAge`, `needHeight`, `needAll` | `datatypeModule-1.1.svg` to `1.4.svg` | screen 1's four answer tiles: Name, Age, Height, All |
| `lookSame`, `lookDifferent`, `allNumbers` | `datatypeModule-2.1.svg` to `2.3.svg` | screen 2's first three answer rows: "They all look the same", "Different kinds of info", "They are all numbers" (the fourth, "They are all words", uses the `string` stand-in) |
| `dropSlot` | `drop-slot.svg` (24 x 24, gray `#C4C4C4`) | screen 3 ("Let’s find similar ones!"): the download-arrow mark in each empty slot (`GroupStage`) |
| `schoolScene` | `school-scene.webp` (1170 x 2154, from the 1560 x 2872 PNG) | screens 5 and 6: the empty school yard behind the title, Hex and the cards, drawn like screen 1's scene (`SchoolScene`) |
| `planStudents`, `planTickets`, `planPrizes` | `datatypeModule-2.2.svg`, `2.1.svg`, `2.3.svg` | screen 5's three cards. They are **the same files as screen 2's answer icons** (not copies): Students, Tickets, Prizes |
| (none: drawn in code) | `SIMILAR_TILES` in `datatypesScreens.tsx`; `NumberBadge` in `visuals.tsx` | screen 5.2 (the second stage of screen 5): the number badge on each of its three tiles, **30 Students, 45 Tickets, 12 Prizes** (the PDF's numbers). They keep the colours of the earlier `datatypeModule-5.2.1.svg` to `5.2.3.svg` badges (40 x 40, radius 12), but the number is set in the module's font, because the 5.2.2 file said 43. Those three SVGs are no longer used. Its four answers use the neutral stand-in pictures (no art yet). Screen 5's three question rows (under its tiles) reuse `planStudents`, `planTickets`, `planPrizes` |
| `valueStudents`, `valueTickets`, `valueHeight`, `valueWeight` | `datatypeModule-6.1.svg` to `6.4.svg` | screen 6's four cards: 12 students, 25 tickets, 148.5 cm height, 36.7 kg weight |

On screens 1 and 2 the answers stay hidden until Hex has finished his line, then bounce in one by one (`optionsAfterHex` on the question, `BounceIn` in `level-two/`). Screens 5 and 6 do the same with their cards (`InfoTiles`, shown once the interaction's `hexSpoken` is true); they are looked at, not picked, so their stage is `ready` (Continue is on from the start).

Screen 6's design pairs the tickets picture with the "148.5 cm height" label and the height picture with "25 tickets". Here each label has its own picture, so the cards keep the design's pictures and colours in place and the two labels are swapped.

To replace either, overwrite the file (keep the same shape: the scene's size is set from its 1560 x 2180 proportions) or point the line in `pictures.ts` at a new one. The faint semi-transparent specks around the card's edge in the original PNG were removed when it was converted.

The other scenes (ruler, names list, the two whole/decimal groups of screen 6, the 12 and "12" cards of screen 13, attendance board, weather card) are drawn in code in `src/components/datatypes/visuals.tsx`.

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

The scenes (registration desk, student profile, counting, ruler, names list, attendance board, weather card) are drawn in code in `src/components/datatypes/visuals.tsx`.

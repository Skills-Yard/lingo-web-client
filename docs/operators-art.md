# Operators module: pictures

Every picture on an option or a card is a **stand-in** from the Sequence and Command modules until the module has art of its own. They are all listed in one place, `src/components/operators/pictures.ts` (`P`).

To use a real picture, put the file in `public/images/operators/` and change that one line (for example `chocolate: "/images/operators/chocolate.webp"`). An idea has the same picture wherever it appears (money is always the coins), so changing one line changes every screen that shows it.

| Key | Stands in for | Today's stand-in |
|---|---|---|
| `money` | rupees, a wallet, a price | the coin |
| `chocolate` | chocolates | the food plate |
| `student`, `teacher` | a student, the teacher | the Level 1 illustrations |
| `person` | someone running, a person's height, a bicycle | the running boy |
| `gift` | a gift box, a rope, a pencil box | the black box |
| `chair` | a chair | the blue cube (Command); the chairs on screen 8 are drawn in code |
| `plant` | a plant | the tree |
| `notebook`, `pen` | a notebook / book / card, a pen / pencil | the document and the prompt icons |
| `bag` | a school bag | the rock |
| `game`, `gate`, `computer`, `light` | a game, a gate, a computer, a signal | the gem, the stop sign, the computer, the traffic signal |
| `think`, `order`, `actions`, `goal`, `short`, `random`, `repeat`, `unsure`, `letters` | answers that must not hint at the right one | the Sequence icons |
| `idea`, `question`, `star`, `stop` | ideas and prompts | the existing icons |

The scenes (wallet, value cards, chocolate heaps and trays, groups, plant garden, number line with a gate, comparison demo, trip facts, shopping bill) and the interactions (expression builder, sharing, rows of chairs, symbol tapping, step-by-step working, ordering) are drawn in code in `src/components/operators/visuals.tsx` and `interactions.tsx`. A few generic ones (tap-to-find-all, pick the right cards) are shared from the Data Types module (`components/datatypes/interactions.tsx`).

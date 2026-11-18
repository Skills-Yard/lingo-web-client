# Variable module: pictures

Most of the Variable module is drawn in code (the classroom, name/value cards, calculator, expense tracker), and screen 2's icons are in `public/animations/svg/variable-module/screen-2/`. The scenes behind the screens are Rive artboards in `public/animations/sequence.riv` (the same file as the Sequence module's bedroom), all 390x306. They are kept for the whole module by `src/lib/rive/variableHost.ts` and drawn by `src/components/variable/scenes.tsx`; the constants are `VARIABLE_SCENES` in `src/lib/rive/runtime.ts`, and `sceneOf` in `variable.ts` says which scene each screen has. The quiz screens drive them from `variableScreens.tsx` (components that draw nothing and set data / fire triggers).

| Scene | Artboard / state machine | Screens | Data |
| --- | --- | --- | --- |
| Trail | `VAR_TrekScene` / `Trek_SM` | every screen without a scene of its own | `thirsty` (screen 2), `noWater` (screen 3); triggers `cheer` (a right answer, on every trail screen) and `drinkHint` (a wrong answer on screens 2 and 3). `thinking` is not used now |
| Items | `VAR_Items` / `Items_SM` | 4 | tapping an answer sets `pick` (water bottle 1, football 2, lunchbox 4; the notebook, 3, is not an answer); checking fires `correct` / `wrong` |
| Bottle | `VAR_Bottle` / `Bottle_SM` | 5, 7, 8, 10, 11 | `capOpen` (the cap opens first), then `level` (ml, 0-1000) moves; `pouring` is on while water is added (5, 7, 8); `showLabel` is off on 8, 10 and 11 until the answer is right |
| Names | `VAR_Names` / `Names_SM` | 12 | `showLabels` is always on; the `shuffle` trigger fires when the screen opens and after each "Try again" |
| Shop | `VAR_Shop` / `Shop_SM` | 18-21 | 18: "Notebook price" / "Pen price" set `highlight` 1 / 2, "Both prices" fires `calc`. 19: `showNames` on; a right drop sets `highlight` (notebook 1, pen 2) and the last fires `correct`; the question sets `highlight` 2. 20: `calc` on open, the Total board (`showTotal`, `total` 70) once right. 21: `showEraser` and `calcAll` on open, the Total board (80) once right. Checking fires `correct` / `wrong` |
| Wallet | `VAR_Wallet` / `Wallet_SM` | 22-25 | 22: the "Pocket money" card (`showCard`, `balance` 100) from the start. 23: `receive` (`amount` 50) on open, the card hidden until right, then `balance` 150. 24: `showToy`, `spend` (`amount` 30) on open, the card hidden until right, then 120. 25: the card shows the old balance and the new one once right (200 → 250 → 220 → 240); `receive` / `spend` fire on open, the toy shows on the spend |

Screen 9 keeps its two drawn bottles, screen 4's bottle answer card is still drawn in code, and screen 28's two items (₹100 and ₹50) are still drawn because `VAR_Shop`'s prices are fixed at ₹50, ₹20 and ₹10. `public/images/variable/trek-bg.webp` is no longer used. The file's other artboards (`VAR_Classroom`, `VAR_Complete`, `VAR_VarCard`, `VAR_MiniApp`) are not wired in yet.

Options on the quiz screens are the other modules' sizes with a little more room: list rows 76px tall, 10px apart, 16px text; cards across 110px (84px for words only), 14px apart, 18px text (screen 2's cards 120px).

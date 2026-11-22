# Handoff: continuing the Lingo module work on another machine

Written on 2026-11-18 from a Claude Code session on branch `conditions-module` (commit `5a1e9fa` at the time). It carries the whole context of that long chat, because Claude's memory notes live on the old machine only.

**To continue:** check the repo out, open it in Claude Code, and say: *"Read HANDOFF.md, then continue with section 6 (the Conditions fix pass)."*

---

## 1. Where things stand

| Module | Route | Steps | PDF | State |
|---|---|---|---|---|
| 2 Sequence | `/module/sequence` | 24 | `2. Sequence- Scenario 1.pdf` | built; text pass done (all 24 screens) |
| 3 Variable | `/module/variable` | 34 | `3. Variable.pdf` | built; text pass **not** done |
| 4 Data Types | `/module/datatypes` | 30 | `4. DataTypes.pdf` | built; PDF-fidelity fix pass done 2026-11-07 (section 5.3) |
| 5 Operators | `/module/operators` | 40 | `5. Operators.pdf` | built; text-length pass **not** done |
| 6 Conditions | `/module/conditions` | 38 | `6. Conditions.pdf` | built and merged; PDF check done 2026-11-18; fix pass **pending** (section 6) |

All PDFs are in `C:\Users\ASUS\Downloads\` on the old machine, **not in the repo**: copy them over.

**Next task:** the Conditions fix pass (section 6). The user chose to do it on the other machine.

## 2. Git facts (check these first, they will have moved)

- `conditions-module` = `5a1e9fa` (local and `origin`). It holds Operators (`b264ab5`) and Conditions on top of the old Data Types branch. It is **67 commits behind** `origin/datatypes-module` (`e3e66e9`) and does not have the teammates' later work.
- Conditions is already in `main`, `dev` and `datatypes-module`. Since `5a1e9fa` teammates changed Conditions only in style and engine plumbing (raised buttons: `CARD_FACE`, `RAISED`, `RAISED_SMALL`, `EDGE` from `@/components/ui/raised`; `InteractionHost` passes `dismissHex` and `hexSpoken`). No content or logic change.
- Other tips seen: `origin/main` `3e807bb`, `origin/dev` `e4fd7f3`, `origin/operators-module` `c9e0b64`.
- **Do the fix pass on a new branch from the latest `main`** (`git fetch`, then `git switch -c conditions-text-pass origin/main`), not on `conditions-module`: this branch lacks the teammates' changes and would conflict. This `HANDOFF.md` is only on `conditions-module`.
- Rules the user set: commit only when asked; **never push unless asked**; end commit messages with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (or whatever the session's attribution line says); never stop the user's own dev server.
- The data-driven-screens work on `feat/data-driven-screens` (a "kit" with `AGENTS.md`, `CLAUDE.md`, `docs/kit*.md`) is not on this branch. If it has landed in `main`, read its `CLAUDE.md` / `AGENTS.md` first.

## 3. How the user wants Claude to work

These came from Claude's memory notes on the old machine.

1. **Ask in popups only.** The user does not read chat replies. Every question or proposal goes in an `AskUserQuestion` popup: name the screen, show the current text, put the suggested texts in the options, mark one *(Recommended)*, always add a *Keep current* option, max 4 questions per call. The *Other* answer is a real answer: follow it literally, and if it is ambiguous confirm in the next popup. (Chat text between popups is not read, so keep it short.)
2. **Reuse what exists.** Layouts from the Sequence and Command modules (`LevelTwoShell`, `HexBubble`, `AnswerCards`, `TileCards`, `FeedbackPanel` with Hex on right *and* wrong). Pictures only from art already in the repo; no generated or placeholder art. No audio unless asked.
3. **Big specs:** ask about each screen before building (grouped questions per screen are fine), then confirm a final plan.
4. **Low RAM** (the PC lags): one dev server and one headless Edge at a time, only when needed. Start the dev server with Bash `run_in_background: true` on a port of your own (3111 was used; the user's own server may be on 3000). Check the port is free first. Do server-free checks first (tsc, eslint, reading code), then one short server session for screenshots. After every run check nothing is left running (`Get-Process node`, and `Get-CimInstance Win32_Process` for `msedge.exe` with a `cdp-` profile). Only stop processes that are provably yours. On Windows killing a parent does not kill its children.
5. **Text rules** (the user's, for modules 2-6):
   - header: 1 line (keep a teal word; drop wrapping and set a smaller `titleSize`: 26 for about 25 letters, 22-24 for 27-29);
   - Hex bubble: 2 lines at most;
   - options: 1 line (1-2 words where possible);
   - result-panel title: 1-2 words; panel text: 2 lines at most;
   - hint sentences are removed ("hint line only"); the hint button stays only where it lights a card. Wrong-try notes inside build interactions (`hint="..."` props) were not touched: ask per screen;
   - **where a PDF exists, its content is authoritative**; shorten wording, never change meaning, order or logic.
6. Adaptive approach already agreed for every module: strong learners **skip** repeat screens; a learner who struggled is sent **once** back to the screen that taught the idea (`SKIPS`, detours, `src/lib/adaptiveFlow.ts`). The user approved "my draft" each time.
7. The battery (1 of 18 units per screen) cannot cover long modules; the user chose to leave it.

## 4. How a module is built (the pattern all of 3-6 share)

Per module in `src/components/<name>/`:

- `<name>.ts`: `STEP` map (step number = PDF screen number), `<NAME>_STEPS`, `<NAME>_LEVEL`, `is<Name>Step`, `SKIPS`, detours, `createAdaptiveFlow(...)` giving `next`, `previous`, `reset`.
- `<name>Score.ts`: `createModuleScore("lingo.<name>")`; `questionId(step, stage) = step * 10 + stage`; `noteAnswer`, `noteStruggle`, `struggled`, `missedStage`, `answeredClean`.
- `<Name>Screen.tsx`: the staged engine (a screen = headline + stages; a stage is a *quiz* or an *interaction*), `<Name>Route.tsx`, `screens*.tsx` (the data), `interactions.tsx`, `visuals.tsx`, `pictures.ts` (`P` stand-in table).
- Server page `src/app/module/<name>/page.tsx` (only `is<Name>Step`); routes in `src/lib/routes.ts`; `PLAYABLE_MODULES` in `src/lib/levelProgress.ts`; path wiring in `src/components/home/HomeRoutes.tsx` and `HomeScreen.tsx`; docs in `docs/routes.md` and `docs/<name>-art.md`.

Engine numbers (frame px, 390 x 844): headline ends at **125** (one line) or **163** (two lines); answer rows **76** tall, 6 apart, rise **150** when checked; tiles rise **180**; interaction panel room **215**; picture auto-fit minimum **0.6**. `parseTitle`: over 25 letters = two lines; 28 px up to 20 letters, else 24 px. Hex bubble: 190 wide holds about 30 letters on two lines, about 248 holds about 46 (long words wrap early). The result panel's text column is 190 wide, about 26 letters a line.

The Data Types engine (`DataTypesScreen.tsx`) has since gained things Conditions and Operators do not have yet: `titleSize` per screen or per stage (`ownTitle`), the bubble rule `length <= 30 ? 190 : 248`, `hexSpoken`, `takeContinue`, `dismissHex`. Porting them is part of the Conditions fix pass.

## 5. What was done in this chat, in order

### 5.1 Operators module (module 5), 2026-11-06
Built from `5. Operators.pdf`: 40 steps, one per PDF screen, screen 40 is `RecapScreen` (then the gem popup). Commit `b264ab5` on `operators-module`. New interactions: `ExpressionStage` (tap blocks into places, auto-checks, `sumOfProducts` accepted variants), `ShareStage`, `FillRowsStage`, `SymbolStage`, `StepStage`, `OrderStage`, `ScenesStage`. Adaptive: skips 20/23/24/30/31, detours listed in `operators.ts` (screen 38 chooses by which question was missed). Later teammates added a flip-card carousel (screen 1) and turn-by-turn stages (screens 2, 5, 6, 11).

### 5.2 Conditions module (module 6), 2026-11-06
Built from `6. Conditions.pdf`: 38 steps, one per PDF screen. Commit `5a1e9fa` on `conditions-module`, reusing Operators code (`isOperator` also treats `and`, `or`, `not` as operators). New: `PredictTestStage`, `ComboStage`, `TableStage`, `PathStage`, `PairUpStage`; helpers `build`, `predict`, `testRows`. `ConditionsScreen` is a copy of `OperatorsScreen` plus the gem popup (`finish: "gem"` on screen 37, then screen 38, then "Lesson complete!"). Decisions the user approved (all "recommended"): all 38 as steps; skips 8, 10, 12, 15, 21, 25, 29, 35; detours to the teaching screen (screen 16 goes to 14 or 7 by which challenge was missed); guided questions as quizzes; "test these values" as predict-the-result rows; truth tables as tap-to-reveal; no if/else anywhere (the PDF forbids it).

### 5.3 Data Types fidelity pass, 2026-11-07
The user said teammates' redesign of Data Types had drifted from the PDF. Fixed with the design unchanged. Structural changes were approved in popups:

- Screen 3 uses the PDF's 8 values (design had 9 with invented 162 and 156).
- Screen 4: Group A = 12, 25, 40 and Group B = names (were swapped), plus the PDF's closing question as a second stage.
- Screen 5: PDF headline, "Prizes", badges 30 / 45 / 12 (drawn in code, `SIMILAR_TILES`); screen 6 gained a tap-the-decimals stage and the whole/decimal groups stage (`PickTilesStage`, `DecimalGroups`); screen 13 gained the 12 vs "12" opening (`TwelveIntro`); screen 2 got its 4th option and lost its hint.
- All headlines, options, bubbles and feedback follow the PDF text cut to the limits; recap uses the PDF recap lines.
- Checked with a text-fit script (152 strings, 0 over the limit) and screenshots of all 30 screens.

These edits were committed afterwards (for example `f10782f`) and are on `datatypes-module`, `dev` and `main`. Later teammate commits changed Data Types again, so re-check against the PDF if in doubt.

### 5.4 Operators Flutter doc, 2026-11-07 (lost)
At the user's request Claude wrote `docs/operators-module-screens.doc` (193 KB, same Word-HTML format as `docs/module-screens.doc`) for the Flutter team: 12 sections covering all 40 screens stage by stage, engine geometry, scoring, adaptive path with pseudocode and worked examples, the interaction catalogue, Flutter mapping with Dart sketches, and known gaps. `docs/` is in `.gitignore` (older docs are tracked only because they were force-added), the file was **never committed**, and it is **no longer on disk**; the generator script is gone too. If the Flutter team still needs it, ask Claude to regenerate it from `src/components/operators/*` (a long task) and `git add -f` it. Its findings that still matter: the text-length rules are not applied to Operators (63 of 129 Hex lines over about 46 letters, 69 of 194 panel texts over about 52 letters, 20 of 40 headlines on two lines); look-only stages count as right answers for the progress bar and accuracy; 40 screens cost more battery than a learner starts with.

### 5.5 Conditions check against the PDF, 2026-11-18
The user asked whether Conditions was implemented from the PDF. Result:

- 38 PDF screens = 38 steps, in the PDF's order.
- All 49 Python conditions in the PDF are in the code (45 verbatim, 2 as token arrays, 2 are prose).
- The PDF is a guided-question script with **no answer options**: the quiz options and wrong-answer lines are drafts the user approved.
- Not done: the text-length rules and the headline wording (see section 6).

## 6. NEXT: the Conditions fix pass

**Ask the user first** (popup) whether to do the *full pass* (follow the PDF wording and content, then fit the limits) or *text limits only* (keep current content, shorten what overflows). They had not chosen yet; they said they would do it on the other machine. The recommended option is the full pass, as for Data Types.

### 6.1 Numbers (counted from the source on 2026-11-18)
- Headlines: 33 of 37 over 25 letters (two lines at 24 px); the step 38 headline is `What Comes Next?`.
- Hex lines: 62 of 102 over about 46 letters (three or more lines in the bubble).
- Result-panel texts: 61 of 111 over about 52 letters (more than two lines); 12 of 85 panel titles over 16 letters.
- The engine `ConditionsScreen.tsx` has no `titleSize` and uses the old bubble rule (`<= 50 ? 190 : <= 90 ? 240 : 262`).

### 6.2 Headlines: PDF against current

| Step | PDF headline | Current headline | Letters |
|---|---|---|---|
| 1 | How does a computer know whether something is correct? | How Does a Computer Know It's Correct? | 38 |
| 2 | A condition is something we can check. | A Condition Is Something We Check | 33 |
| 3 | Can a statement be both True and False? | Can a Statement Be True and False? | 34 |
| 4 | Having information is not the same as checking information. | Information Is Not a Condition | 30 |
| 5 | A condition is constructed, not memorised. | A Condition Is Constructed | 26 |
| 6 | What makes a number positive? | What Makes a Number Positive? | 29 |
| 7 | What is the relationship between positive numbers and zero? | The Positive-Number Condition | 29 |
| 8 | What makes a number negative? | What Makes a Number Negative? | 29 |
| 9 | How do we check whether a number is exactly 7? | Is the Number Equal to 7? | 25 |
| 10 | What if we want every number except 7? | What About Every Number Except 7? | 33 |
| 11 | What does "at least 10" mean? | What Does "At Least 10" Mean? | 29 |
| 12 | What does "at most 10" mean? | What Does "At Most 10" Mean? | 28 |
| 13 | How can we identify an even number? | How Can We Spot an Even Number? | 31 |
| 14 | How do we check whether anything remains? | How Do We Check What Remains? | 29 |
| 15 | What happens when a number is odd? | What Happens When a Number Is Odd? | 34 |
| 16 | Can you build the condition? | Can You Build the Condition? | 28 |
| 17 | What if one requirement is not enough? | What If One Requirement Is Not Enough? | 38 |
| 18 | When are both requirements True? | When Are Both Requirements True? | 32 |
| 19 | When should we conduct the extra class? | When Is the Extra Class On? | 27 |
| 20 | Does OR require everyone? | Does OR Need Everyone? | 22 |
| 21 | One word can change the entire requirement. | One Word Changes Everything! | 28 |
| 22 | How do we check whether a number belongs to a range? | Is a Number in a Range? | 23 |
| 23 | How do we express both requirements? | Both Boundaries Included | 24 |
| 24 | What if 20 is not allowed? | What If 20 Is Not Allowed? | 26 |
| 25 | What if neither boundary is allowed? | What If Neither Boundary Is Allowed? | 36 |
| 26 | What if the number must be outside 10 to 20? | What If a Number Is Outside 10 to 20? | 37 |
| 27 | What happens when we reverse a statement? | What Happens When We Reverse a Statement? | 41 |
| 28 | How can we reverse a condition in Python? | How Do We Reverse a Condition? | 30 |
| 29 | What if a number is NOT greater than 10? | What If a Number Is NOT Greater Than 10? | 40 |
| 30 | Can one condition contain multiple requirements? | Can One Condition Hold Two Requirements? | 40 |
| 31 | What if either requirement is acceptable? | What If Either One Is Enough? | 29 |
| 32 | What if a requirement has multiple groups? | What If a Requirement Has Groups? | 33 |
| 33 | Can you translate this requirement? | Can You Translate This Requirement? | 35 |
| 34 | Can you find what is wrong? | Can You Find What Is Wrong? | 27 |
| 35 | Does this condition represent the requirement? | Does This Condition Fit the Rule? | 33 |
| 36 | You are now the condition designer. | You Are the Condition Designer! | 31 |
| 37 | You can now construct conditions! | You Can Now Construct Conditions! | 33 |
| 38 | You know how to ask a program a question. What's next? | What Comes Next? | 16 |

Most PDF headlines are 30-60 letters, so one line means cutting them anyway (a teal word stays; `titleSize` 22-26). Where the current headline already says what the PDF says, it can stay.

### 6.3 Plan
1. `git fetch`, branch from the latest `main` (section 2). Install deps (`npm install`).
2. Copy `6. Conditions.pdf` over and extract its text: `pip install pymupdf`, then `python -c "import pymupdf; d=pymupdf.open(r'<path>'); print(''.join(p.get_text() for p in d))" > text.txt`. The PDF has 38 screens (`SCREEN 01` to `SCREEN 38`) in 9 phases.
3. Port the engine changes from `DataTypesScreen.tsx` into `ConditionsScreen.tsx`: `titleSize` (and per-stage title), the bubble rule `length <= 30 ? 190 : 248`. (Operators has the same gap; it can share the change.)
4. Go **screen by screen** (popups, one screen per call): compare the PDF's headline, scenario, test values, results, "Expected discovery" and CTA with the screen's stages; list differences; propose texts that fit the limits; apply after the answer. Ask before adding or removing any step or stage.
5. Check without a server first: `npx tsc --noEmit -p .` and `npx eslint src/components/conditions`. Then a text-fit check: measure each string at its real width in a headless Edge (Poppins; Hex line 16 px / 1.24 weight 500 in the bubble width minus 24 px of padding; panel text 14 px / 20 px weight 500 in 190; option 14 px / 22 px in about 175; headline at its size must stay under about 366 px wide), then screenshots of the changed screens (390 x 844; init script sets `sessionStorage` key `lingo.battery` to `{"level":100,"unlimited":true,"charged":0}`; use `{ force: true }` clicks).
6. Update the Conditions section of `docs/routes.md` and `docs/conditions-art.md`.
7. Commit only when asked.

### 6.4 Conditions facts you will need
- Files: `src/components/conditions/` (`conditions.ts`, `conditionsScore.ts`, `ConditionsScreen.tsx`, `NextScreen.tsx` for step 38, `ConditionsRoute.tsx`, `screensA.tsx` steps 1-12, `screensB.tsx` 13-26, `screensC.tsx` 27-37, `helpers.tsx`, `interactions.tsx`, `visuals.tsx`, `screen.ts`).
- `STEP` names: why 1, whatIs 2, trueFalse 3, infoVsCondition 4, construct 5, positiveMeaning 6, positiveCondition 7, negative 8, equal 9, notEqual 10, atLeast 11, atMost 12, evenIdea 13, remainder 14, odd 15, challenge 16, twoRequirements 17, andTable 18, orClass 19, orTable 20, andVsOr 21, range 22, inclusive 23, firstIncluded 24, bothExcluded 25, outside 26, reverse 27, notPython 28, notComparison 29, marksAttendance 30, alternatives 31, groups 32, workshop 33, boundaryBug 34, andOrBug 35, designer 36, toolkit 37, next 38.
- Skips (a screen is skipped when the listed ones were answered clean): 8 after 7; 10 after 9; 12 after 11; 15 after 14; 21 after 18 and 20; 25 after 24; 29 after 28; 35 after 34.
- Detours (struggled on a screen: sent back once, then resumes): 3 to 2; 4 to 2; 5 to 4; 7 to 6; 8 to 7; 9 to 7; 10 to 9; 11 to 7; 12 to 11; 14 to 13; 15 to 14; 16 to 14 (missed stage 0 or 1) or 7 (missed stage 2 or 3); 18 to 17; 19 to 18; 20 to 19; 21 to 18; 23 to 22; 24 to 23; 25 to 24; 26 to 20; 28 to 27; 29 to 28; 30 to 23; 31 to 20; 32 to 30; 33 to 32; 34 to 23; 35 to 21; 36 to 33.
- Scoring: a stage's question id is `step * 10 + stage`; a screen is "clean" when its stage 0 was right the first time and it had no miss.
- Ending: "Complete Chapter" on step 37 opens the gem popup, closing it shows step 38 (`NextScreen`: three condition cards, the "Selection / Decision Making" pathway), Continue goes to "Lesson complete!".
- The progress bar counts screens (38), not stages.

## 7. Other open items
- **Operators text pass**: same rules, not done (section 5.4 numbers).
- **Variable text pass**: not started (step 1 was next). Sequence is done.
- **Operators Flutter doc**: lost; regenerate if needed (section 5.4).
- Battery: 1 of 18 units per screen; Sequence, Variable, Data Types, Operators and Conditions all run out unless streaks or the trial refill it. The user chose to leave it.
- Path module cards in `HomeScreen.tsx` `MODULES` still carry some old names ("Module 2 Variables & Data Types", "Module 3 Control Flow").
- Dark mode not checked on the new screens. Missing audio files for Sequence steps 10 and 11 (`/audios/moduleAudios/meet_the_sequence.mp3`, `order_matters.mp3`) and the Command module's `meet-the-command.mp3`.
- Known nits left as they were: Data Types screen 7 says "Number of students: 25" (PDF says 30, not one of its cards); screen 24 keeps the short card labels "Completion %" and "Level completed?".

## 8. Tooling notes (Windows)
- Screenshots/tests: `playwright-core` driving the installed Microsoft Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`), headless, viewport 390 x 844. Dev server on a port of your own (`npx next dev -p 3111`). Edge downloads `.doc` files instead of showing them: copy to `.html` to preview.
- PDF text: PyMuPDF (`pip install pymupdf`; import `pymupdf`).
- The old machine's scratch scripts (screenshot, wrap-check, flow tests) are not in the repo; rewrite what you need, they were small.
- The Word-style docs in `docs/` (`module-screens.doc`, `module-rive-animations.doc`) are HTML with Word namespaces; they are tracked, the rest of `docs/` is ignored by git.

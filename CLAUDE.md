# lingo-web-client

Project instructions for any AI assistant or developer. The file is called `CLAUDE.md` because Claude Code loads it by itself; for other tools `AGENTS.md` points here, and it is plain Markdown to read as your own instructions.

Next.js 16 (App Router) + React 19 + Tailwind v4 PWA: a mobile-first learn-to-code app. Every lesson screen is laid out as a 390 × 844 stage scaled to the device. Rive artboards (`public/animations/*.riv`) draw the mascot **Hex**, the battery, the progress bar, the main button, the robot arm and more.

## The rule (firm, from the owner)

**All screens share ONE component kit. Screen data may name only kit components. No module- or screen-specific components, and the same design is always the same component.** The data (JSON) says *which* component and *what it shows*.

Read, in this order:
1. `docs/kit-handoff.md` — the whole context of the thread that built this: **section 0 is the state right now (done, half done, broken, next action)**, then what was built, decisions, the dated decision log and how to work with the owner. **Start here when resuming.**
2. `docs/kit-components.md` — the decided component list and names (LessonHeader, LessonFooter, LessonTitle, HexGuide, ResultSheet, Answers, ...).
3. `docs/kit.md` — reference for the kit, the data format, the runner.

**These docs are on branch `feat/data-driven-screens` only** (this file is on several branches, the kit docs are not): cut new work from that branch, or merge it first. Last checked against the code on 2026-11-18. `node scripts/kit-audit.mjs` re-checks the docs and the data files against the code in seconds (no server): run it first on a new machine and after every merge of the team's work; if it disagrees with the docs, the code is right, fix the docs.

## Where we are (details: `docs/kit-handoff.md` section 0)

Four modules play from data (142 screens). Done: one header and footer, `Answers` (looks in the data, `instant`), `SortGroups`, `RevealCards`, scenes behind screens. Written but not wired: `BlockBuilder`, `SwitchTable`, `PredictRows`, `OrderSteps` look `tap`. Known broken: `/kit/play/variable?step=19` until Variable is re-exported on `/kit/export`. Not started: `NumberLine`, `LessonCards` merges, the 7 whole screens still module-named, Sequence and Command, switching `/module/*`.

## Where things are

| What | Where |
|---|---|
| The kit (components) | `src/components/kit/` (`index.ts` = the public, decided components; `internal.ts` = everything, for the gallery) |
| Content components still to merge | `src/components/kit/content/from-<module>/` (pictures and interactions moved out of the modules; transitional) |
| Screen data (JSON) | `src/data/modules/{datatypes,operators,conditions,variable}.json` — generated, see below |
| Data runner | `src/components/kit/runtime/` (`ScreenRunner`, `ModuleRunner`, `hydrate`, `extract`, `registry`, `modules`) |
| Gallery, compare, export pages | `src/app/kit/**` and `src/components/kit/gallery/**` |
| Legacy screens (still live at `/module/*`) | `src/components/{datatypes,operators,conditions,variable,sequence,level-one,level-two}/` |

## Run and check

- `npm run dev`. The owner usually already has `next dev` on **port 3000** (Next 16 allows one per project): check `ss -ltnp` and use it instead of starting another.
- `npx tsc --noEmit -p .` and `npx eslint src/components/kit src/app/kit` must stay clean. (Older onboarding / level-one files have pre-existing lint errors; not ours.)
- Pages: `/kit` (every component working), `/kit/screen` (a whole screen from kit parts), `/kit/compare?module=datatypes&step=1` (**code vs data side by side**, the way to check parity), `/kit/play/<module>?step=N` (a module played from data), `/kit/export` (dev only: reads the screens from code, verifies them, writes the JSON; shows the **Kit coverage** meter).
- `node scripts/kit-audit.mjs`: does every component the data names exist in code? coverage numbers and the merge to-do list; do the docs name missing files or components?
- Visual checks without a browser tool: `scripts/cdp.mjs` drives headless Chrome (see `docs/kit-handoff.md`). On Windows set `CHROME` to Edge's or Chrome's `.exe`.
- **The owner's machine is Windows with little free RAM** (15.8 GB, often 3 to 5 GB free). One dev server and one headless browser at most, only for a batch of checks; stop them after and check no `node` / `msedge` of yours is left (a killed parent leaves its children on Windows). Do `tsc`, `eslint` and the audit first. Details: `docs/kit-handoff.md` section 10.

## Data files are generated

`src/data/modules/*.json` come from `/kit/export`, which reads the modules' `SCREENS` as written in code, checks each picture/interaction by redrawing the data with sample values, and writes the files. Press "Write src/data/modules/<id>.json" on that page. Re-exporting overwrites hand edits, so once the code screens are deleted, stop using it and edit the JSON.

## Gotchas

- The battery is in **sessionStorage** (`lingo.battery`, `{level, unlimited, charged}`), not localStorage. The compare page has an "Unlimited battery" button; without it the battery runs out and an "Out of energy" sheet covers screens.
- Rive hosts are singletons: one lesson button, one persistent progress bar and battery per page. Use `persistent={false}` variants to show several.
- Pages that draw Hex or lesson artboards need `HexRiveGate` (see `src/app/kit/layout.tsx`).
- `FeedbackPanel`, `LevelOneShell`, `LevelTwoShell`, `HexBubble`, `ActionRow` are the shared lower layer; kit components wrap them. Don't fork them.
- Hrefs in `src/lib/routes.ts` are play-aware: on `/kit/play/*` they stay in the player.
- Source files are CRLF on Windows: a script that replaces text must match `\r\n` (or use the Edit tool). `npx tsc` can print errors from `.next/types/*` (generated, stale): not source errors, filter them or delete `.next`.
- The team keeps editing the code screens, which makes the data files stale: after any change to a module's screens, press Write for that module on `/kit/export` and get 0 issues.

## Working with the owner

- Not a native English speaker; likes short, plain updates. Naming should be relatable (`LessonHeader`, not `Header2`).
- Decisions about components/names are made with **popup questions** (`AskUserQuestion` in Claude Code; in another tool, any multiple-choice prompt or a short numbered list of options), a few at a time, recommended option first; the owner does not read long chat replies, so proposals and questions go in popups. Record each decision in `docs/kit-components.md` and in the dated log in `docs/kit-handoff.md` section 9.
- One activity at a time: each merge keeps every screen's look (one component, the data picks the `look`); check it on screen (code route vs data route) before moving on.
- Never add a module-specific component. If a screen needs something new, add a general kit component or a setting on an existing one.
- Commit/push only when asked. Commits end with the Co-Authored-By trailer.

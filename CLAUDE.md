# lingo-web-client

Next.js 16 (App Router) + React 19 + Tailwind v4 PWA: a mobile-first learn-to-code app. Every lesson screen is laid out as a 390 × 844 stage scaled to the device. Rive artboards (`public/animations/*.riv`) draw the mascot **Hex**, the battery, the progress bar, the main button, the robot arm and more.

## The rule (firm, from the owner)

**All screens share ONE component kit. Screen data may name only kit components. No module- or screen-specific components, and the same design is always the same component.** The data (JSON) says *which* component and *what it shows*.

Read, in this order:
1. `docs/kit-handoff.md` — the whole context of the thread that built this: what was done, decisions, current state, next steps. **Start here when resuming.**
2. `docs/kit-components.md` — the decided component list and names (LessonHeader, LessonFooter, LessonTitle, HexGuide, ResultSheet, Answers, ...).
3. `docs/kit.md` — reference for the kit, the data format, the runner.

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
- Visual checks without a browser tool: `scripts/cdp.mjs` drives headless Chrome (see `docs/kit-handoff.md`).

## Data files are generated

`src/data/modules/*.json` come from `/kit/export`, which reads the modules' `SCREENS` as written in code, checks each picture/interaction by redrawing the data with sample values, and writes the files. Press "Write src/data/modules/<id>.json" on that page. Re-exporting overwrites hand edits, so once the code screens are deleted, stop using it and edit the JSON.

## Gotchas

- The battery is in **sessionStorage** (`lingo.battery`, `{level, unlimited, charged}`), not localStorage. The compare page has an "Unlimited battery" button; without it the battery runs out and an "Out of energy" sheet covers screens.
- Rive hosts are singletons: one lesson button, one persistent progress bar and battery per page. Use `persistent={false}` variants to show several.
- Pages that draw Hex or lesson artboards need `HexRiveGate` (see `src/app/kit/layout.tsx`).
- `FeedbackPanel`, `LevelOneShell`, `LevelTwoShell`, `HexBubble`, `ActionRow` are the shared lower layer; kit components wrap them. Don't fork them.
- Hrefs in `src/lib/routes.ts` are play-aware: on `/kit/play/*` they stay in the player.

## Working with the owner

- Not a native English speaker; likes short, plain updates. Naming should be relatable (`LessonHeader`, not `Header2`).
- Decisions about components/names are made with **popup questions** (AskUserQuestion), a few at a time. Record each decision in `docs/kit-components.md`.
- Never add a module-specific component. If a screen needs something new, add a general kit component or a setting on an existing one.
- Commit/push only when asked. Commits end with the Co-Authored-By trailer.

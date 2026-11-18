# AGENTS.md

For any AI coding assistant (Codex, Cursor, Copilot, Gemini, Claude Code, ...) and for developers. This file only points; the facts are in the files below, so they cannot drift apart.

The working context of the screen kit and the data-driven screens is kept in plain Markdown, **on branch `feat/data-driven-screens` only**. Read, in this order:

1. `CLAUDE.md`: the rules, where things are, how to run and check. It is named for Claude Code, which loads it by itself; for every other tool it is simply the project instructions, so read it as yours.
2. `docs/kit-handoff.md`: **section 0 is the state right now** (done, half done, broken, next action), then what was built, the decisions, the dated decision log and how to work with the owner.
3. `docs/kit-components.md` (the decided component list) and `docs/kit.md` (the kit, the data format, the runner).

First commands on a new machine: `npm install`, `npm run dev`, open `/kit`, then `node scripts/kit-audit.mjs` (checks the docs and the data files against the code, no server needed) and `npx tsc --noEmit -p .`.

If these files are missing you are not on that branch: `git checkout feat/data-driven-screens`.

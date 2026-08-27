# lingo-web-client — Instructions Intro

A standalone Next.js 16 (App Router) app containing only the **instructions-intro** flow:
a 5-slide lesson that introduces what "instructions" are, with a teacher quiz in the middle.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the flow is the root route.

Deep-link to a specific slide with `?step=` (0-based):
`http://localhost:3000/?step=2` opens the quiz.

## Slides

| step | kind            | screen component            |
| ---- | --------------- | --------------------------- |
| 0    | `cover`         | `CoverScreen`               |
| 1    | `teacher-intro` | `TeacherIntroScreen`        |
| 2    | `teacher-quiz`  | `TeacherQuizScreen`         |
| 3    | `examples-grid` | `ExamplesGridScreen`        |
| 4    | `video`         | `VideoScreen`               |

## Structure

```
src/
  app/
    layout.tsx            root layout + <ThemeProvider>
    page.tsx              renders <InstructionsIntroFlow>
    globals.css           Tailwind v4 + theme tokens + the 2 animations used
  components/
    instructions-intro/
      InstructionsIntroFlow.tsx   step/quiz state machine, swaps in the screen
      IntroHeader.tsx             back / progress / bookmark / theme toggle
      IntroFooter.tsx             quiz feedback banner + primary CTA
      CoverScreen.tsx
      TeacherIntroScreen.tsx
      TeacherQuizScreen.tsx
      TeacherIllustration.tsx     shared teacher artwork (intro + quiz)
      ExamplesGridScreen.tsx
      VideoScreen.tsx
    ui/
      theme-toggle.tsx
  context/
    ThemeContext.tsx       light/dark, persisted to localStorage ("lingo_theme")
  hooks/
    useSound.ts            WebAudio blips for tap / win / lose (no asset files)
  lib/
    constants/
      instructionsIntro.ts  all slide copy + the InstructionsSlide union type
public/
  images/                  16 PNGs referenced by the slides
```

## Editing content

All slide text, options and image paths live in
[`src/lib/constants/instructionsIntro.ts`](src/lib/constants/instructionsIntro.ts).
The `InstructionsSlide` discriminated union there is the single source of truth —
add a `kind` to the union, add a branch in `InstructionsIntroFlow`, and drop in a
screen component.

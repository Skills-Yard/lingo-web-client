# Routes

## Onboarding

| Route | Screen |
|---|---|
| `/` | Redirects to `/onboarding` |
| `/onboarding` | Splash |
| `/onboarding?step=sign-up` | Sign-up |
| `/onboarding?step=greeting` | "Hey! I'm Hex" |
| `/onboarding?step=ready-check` | "Are you ready?" |
| `/onboarding?step=career` | Career question |
| `/onboarding?step=good-news` | "Your career runs on Python" |
| `/onboarding?step=python-level` | Python level question |
| `/onboarding?step=experience` | Coding experience question |
| `/onboarding?step=building-path` | "Building Career Path…" |
| `/onboarding?step=all-set` | "All set!" |
| `/onboarding?step=name` | Name input |
| `/onboarding?step=motivation` | Motivation question |
| `/onboarding?step=time-commitment` | Minutes-per-day dial |
| `/onboarding?step=learning-time` | Best time of day to learn |
| `/onboarding?step=notifications` | Notification permission |
| `/onboarding?step=streak` | Streak widget |
| `/onboarding?step=three-months` | "In 3 months…" |
| `/onboarding?step=starting-point` | How to begin your path |

## Level 1 screens

| Route | Screen |
|---|---|
| `/module?level=1&step=1` | How programmers think (reveal card) |
| `/module?level=1&step=2` | "Teacher Says" |
| `/module?level=1&step=3` | Quiz: "What teacher is doing?" |
| `/module?level=1&step=4` | Examples of instruction |
| `/module?level=1&step=5` | Quiz: "What are instructions known as?" |
| `/module?level=1&step=6` | Instruction = command |
| `/module?level=1&step=7` | Move-Hex game board |

## Other pages

| Route | Page |
|---|---|
| `/level` | Level path (home), where onboarding ends |
| `/profile` | Profile |
| `/hex` | `hex.riv` animation viewer |
| `/module1/combined`, `/module1/review` | Old instructions-intro design comparison (`?step=<index>`) |

## Notes

| Case | What happens |
|---|---|
| Moving through onboarding | The URL updates, so refreshing keeps you on the same screen |
| Unknown `?step=` in onboarding | Opens the splash |
| Onboarding screen opened directly | Shows the answers given earlier in this browser session (e.g. `good-news` names your career) |
| Voiced screen opened directly | Plays no voiceover: the browser blocks audio until the user taps something |
| `/module` with no params | Opens Level 1, step 1 |
| Any other level or step | 404 (only Level 1 exists so far) |
| Adding an onboarding step | Its `?step=` name is its id from `ONBOARDING_STEPS`, in kebab-case |

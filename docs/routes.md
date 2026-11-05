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

## Sequence module

Built from the "2. Sequence - Scenario 1" spec (its screen number is in brackets). `step` numbers are the module's own order (`STEP` in `components/sequence/sequence.ts`).

| Route | Screen |
|---|---|
| `/module/sequence?step=1` | "What to put on first?" (socks and shoes) [1] |
| `/module/sequence?step=2` | "Let's Put On Socks First!!" (animation) [2] |
| `/module/sequence?step=3` | "Let's Put On Shoes Now!!" ("Put On Shoes" button, animation) [3] |
| `/module/sequence?step=4` | "Ready to Go Now" [4] |
| `/module/sequence?step=5` | "What did you do?" (every pick gets a message, no retry) [5] |
| `/module/sequence?step=6` | "Compare both attempts" (not in the spec) |
| `/module/sequence?step=7` | "Think one step ahead." [6] |
| `/module/sequence?step=8` | "What's the first command" (robot; not in the spec) |
| `/module/sequence?step=9` | "Arrange the instructions!" (robot, drag and drop) [7] |
| `/module/sequence?step=10` | "Meet the Sequence." (text darkens as the clip plays) [8] |
| `/module/sequence?step=11` | "Tap to reveal" (flip card) [9] |
| `/module/sequence?step=12` | "Arrange the instructions!" (socks and shoes, uses the onboarding name) [10] |
| `/module/sequence?step=13` | "Let's help HEX reach the energy!" [11] |
| `/module/sequence?step=14` | "How will HEX reach the battery?" (three MOVE FORWARDs; charges the battery once) [12] |
| `/module/sequence?step=15` | "Can you put the commands in the right order?" (3 x 3 board) [13] |
| `/module/sequence?step=16` | "Think before you move!" (predict where Hex ends up) [14] |
| `/module/sequence?step=17` | A longer sequence (right and unhelped on 16) or a simpler one (a miss or hint on 16) [14] |
| `/module/sequence?step=18` | "Something went wrong!" (fix the order) [15] |
| `/module/sequence?step=19` | "Plan HEX's journey." (build the sequence, then Run) [16] |
| `/module/sequence?step=20` | "A longer journey!" (only for a learner who planned 19 without a miss) [16] |
| `/module/sequence?step=21` | "One last challenge." (tea; heat before pour) [17] |
| `/module/sequence?step=22` | "Why does the proper order of commands matter?" [18] |
| `/module/sequence?step=23` | "How do you decide which command should come first?" [19] |
| `/module/sequence?step=24` | "You've mastered Sequence!" (recap, then the gem popup) [20] |
| `/module/sequence?step=complete` | "Lesson complete!" |

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
| Sequence module: Back / Continue around step 20 | Step 20 is skipped (and Back skips it) when the learner struggled on step 19 |
| Sequence module: score and branches | Kept in session storage (`lingo.sequence-*`), cleared when the module is opened from the path |
| `/module` with no params | Opens Level 1, step 1 |
| Any other level or step | 404 (only Level 1 exists so far) |
| Adding an onboarding step | Its `?step=` name is its id from `ONBOARDING_STEPS`, in kebab-case |

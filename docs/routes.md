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

## Variable module

Built from the "3. Variable" spec (its screen number is in brackets; screens with an interaction and a question have two stages on the one step). `step` numbers are the module's own order (`STEP` in `components/variable/variable.ts`).

| Route | Screen |
|---|---|
| `/module/variable?step=1` | "Let's Go on a Trekking Adventure!" [1] |
| `/module/variable?step=2` | "We Are Getting Thirsty!" (tap the object) [2] |
| `/module/variable?step=3` | "What If There Is No Water Nearby?" [3] |
| `/module/variable?step=4` | "What Should We Carry?" (a wrong object spills) [4] |
| `/module/variable?step=5` | "A Bottle Holds Water!" [5] |
| `/module/variable?step=6` | "Programs Need to Keep Information Too!" (tap the bottle, then the panel) [6] |
| `/module/variable?step=7` | "How Much Water Should We Carry?" (slide to 500 ml) [7] |
| `/module/variable?step=8` | "We Need More Water!" [8] |
| `/module/variable?step=9` | "Same Bottle, Different Amount!" [9] |
| `/module/variable?step=10` | "Let's Drink 200 ml!" [10] |
| `/module/variable?step=11` | "The Bottle Is Empty!" (skipped after clean 8 and 10) [11] |
| `/module/variable?step=12` | "Imagine Everyone Has the Same Bottle!" [12] |
| `/module/variable?step=13` | "Variables Have Names and Values!" (tap Name and Value) [13] |
| `/module/variable?step=14` | "A Name and a Value!" (sort name / value, then a question) [14] |
| `/module/variable?step=15` | "A New Day at School!" [15] |
| `/module/variable?step=16` | "Three Different Pieces of Information!" (tap each name, then a question) [16] |
| `/module/variable?step=17` | "More Students Come Tomorrow!" [17] |
| `/module/variable?step=18` | "Time to Buy Some School Supplies!" [18] |
| `/module/variable?step=19` | "Let's Organise the Prices!" (drag names onto prices, then a question) [19] |
| `/module/variable?step=20` | "How Much Do We Need to Pay?" [20] |
| `/module/variable?step=21` | "We Also Need an Eraser!" (skipped after clean 18 and 20) [21] |
| `/module/variable?step=22` | "Let's Manage Your Pocket Money!" [22] |
| `/module/variable?step=23` | "You Received Another ₹50!" [23] |
| `/module/variable?step=24` | "You Bought a Toy for ₹30!" (skipped after clean 22 and 23) [24] |
| `/module/variable?step=25` | "Can You Track Your Balance?" (three balance questions) [25] |
| `/module/variable?step=26` | "Can We Build a Simple Addition App?" [26] |
| `/module/variable?step=27` | "What Steps Does Our App Need?" (drag six steps into order) [27] |
| `/module/variable?step=28` | "Find the mistake!" [28] |
| `/module/variable?step=29` | "Let's Build a Travel Expense Tracker!" (two questions) [29] |
| `/module/variable?step=30` | "Why do programs need variables?" [30, question 1] |
| `/module/variable?step=31` | "Can the value of a variable change?" [30, question 2] |
| `/module/variable?step=32` | "Why do we give variables meaningful names?" [30, question 3] |
| `/module/variable?step=33` | "Why keep track of both numbers?" [30, question 4] |
| `/module/variable?step=34` | "You Have Unlocked Variables!" (then the gem popup) [31] |
| `/module/variable?step=complete` | "Lesson complete!" |

## Data Types module

Built from the "4. DataTypes" spec (its screen number is in brackets; screens with an interaction and a question have two stages on the one step). The design is the Sequence and Command modules': Hex's short line, option rows or tiles with a picture, sorting groups, and the Hex result panel. `step` numbers are the module's own order (`STEP` in `components/datatypes/datatypes.ts`).

| Route | Screen |
|---|---|
| `/module/datatypes?step=1` | "Let's Organise Our School Event!" [1] |
| `/module/datatypes?step=2` | "Meet Aarav!" [2] |
| `/module/datatypes?step=3` | "Let's Find the Similar Ones!" (free grouping into three groups of three, not marked, recorded) [3] |
| `/module/datatypes?step=4` | "Information can differ!" (tap each of the three groups and Hex says what it tells us; one stage, no question after it) [4] |
| `/module/datatypes?step=5` | "Let's plan a school event!" (three cards to look at: Students Registered?, Tickets Sold?, Prizes Available?; they bounce in after Hex, Continue waits until Hex has finished his line), then stage 5.2 "How are they similar?" (30 Students, 43 Tickets, 12 Prices and three question rows; the first Continue brings up "Exactly!", the next goes on) [5] |
| `/module/datatypes?step=6` | "Are all numbers same?" (four cards to look at: 12 students, 25 tickets, 148.5 cm height, 36.7 kg weight; same behaviour as screen 5) [6] |
| `/module/datatypes?step=7` | "Meet Integers!" [7] |
| `/module/datatypes?step=8` | "Need more precision?" (Float, then a question) [8] |
| `/module/datatypes?step=9` | "Sort the numbers!" (Integer or Float) [9] |
| `/module/datatypes?step=10` | "What about names?" [10] |
| `/module/datatypes?step=11` | "Which ones are text?" [11] |
| `/module/datatypes?step=12` | "Meet Strings!" [12] |
| `/module/datatypes?step=13` | "Same look, same type?" (12 and "12", two questions) [13] |
| `/module/datatypes?step=14` | "Check the attendance!" [14] |
| `/module/datatypes?step=15` | "Yes or no answers!" (skipped after a clean 14) [15] |
| `/module/datatypes?step=16` | "Meet Boolean!" [16] |
| `/module/datatypes?step=17` | "Four data types!" [17] |
| `/module/datatypes?step=18` | "Look beyond looks!" (match to types, then a question) [18] |
| `/module/datatypes?step=19` | "Data decides its use!" [19] |
| `/module/datatypes?step=20` | "Organise Aarav's info!" (skipped after clean 9 and 18) [20] |
| `/module/datatypes?step=21` | "Build a weather app!" [21] |
| `/module/datatypes?step=22` | "Plan before you build!" (ends on the weather card preview) [22] |
| `/module/datatypes?step=23` | "Can You Find the Mistake?" (find it, then fix its type) [23] |
| `/module/datatypes?step=24` | "Sort a game profile!" (sort, then a question) [24] |
| `/module/datatypes?step=25` | Reflection: which type suits an age of 12? [25, question 1] |
| `/module/datatypes?step=26` | Reflection: which type suits a height of 152.5 cm? [25, question 2] |
| `/module/datatypes?step=27` | Reflection: why is the ID "0045" text? [25, question 3] |
| `/module/datatypes?step=28` | Reflection: which type is True or False? [25, question 4] |
| `/module/datatypes?step=29` | Reflection: types for a city, a temperature and a rain status [25, question 5] |
| `/module/datatypes?step=30` | "You Have Unlocked Data Types!" (then the gem popup) [26] |
| `/module/datatypes?step=complete` | "Lesson complete!" |

## Operators module

Built from the "5. Operators" spec: one step for each of its 40 screens (the step number is the PDF's screen number; a screen with several parts has several stages on the one step). The design is the Sequence and Command modules': Hex's short line, option rows or tiles with a picture, and the Hex result panel. The wording is shortened from the PDF. `step` numbers are `STEP` in `components/operators/operators.ts`.

| Route | Screen |
|---|---|
| `/module/operators?step=1` | "Have You Ever Done These Things?" (tap four scenes) |
| `/module/operators?step=2` | "What Are We Actually Doing?" (four situations: adding, dividing, comparing, subtracting) |
| `/module/operators?step=3` | "Remember What We Learned?" (information cards, then Yes/No) |
| `/module/operators?step=4` | "How Much Money Will Remain?" (build 150 + 50, then 500 - 200, then a question) |
| `/module/operators?step=5` | "Meet the Operators!" (tap + - * /) |
| `/module/operators?step=6` | "Calculate or Compare?" |
| `/module/operators?step=7` | "What Happens When Values Come Together?" (wallet: add, subtract, two more situations) |
| `/module/operators?step=8` | "What If Every Group Has the Same Quantity?" (fill four rows of chairs, then 4 * 5) |
| `/module/operators?step=9` | "Can Everyone Get the Same Number?" (predict, share 20 chocolates, / gives 5.0) |
| `/module/operators?step=10` | "When Sharing Is Not Equal" (share 23 among 4: 5 each, 3 left) |
| `/module/operators?step=11` | "Same Numbers, Three Answers!" (/, // and %) |
| `/module/operators?step=12` | "Not Enough for Even One Group?" (1 chocolate, 2 students) |
| `/module/operators?step=13` | "How Much Remains?" (four // and % challenges) |
| `/module/operators?step=14` | "Growing Bigger, Faster!" (**) |
| `/module/operators?step=15` | "Can You Calculate the Total Bill?" (build 3 * 20 + 2 * 10) |
| `/module/operators?step=16` | "Does Calculation Order Matter?" (2 + 3 * 4 and (2 + 3) * 4, step by step) |
| `/module/operators?step=17` | "Arrange the Calculation" (2 * 50 + 20, then 2 * (50 + 20)) |
| `/module/operators?step=18` | "Understand the Situation!" (which expression fits) |
| `/module/operators?step=19` | "Who Is Older?" (True and False from a real situation) |
| `/module/operators?step=20` | "True or False?" (four statements; skipped after a clean 19) |
| `/module/operators?step=21` | "Let the Computer Compare!" (the six comparison symbols) |
| `/module/operators?step=22` | "Always Read Left to Right" (open and closed side) |
| `/module/operators?step=23` | "Read What the Expression Says" (six expressions; skipped after a clean 22) |
| `/module/operators?step=24` | "Write What the Sentence Says" (five builds; skipped after clean 22 and 23) |
| `/module/operators?step=25` | "Six Ways to Compare Values!" (== vs =) |
| `/module/operators?step=26` | "The Number Line Challenge" |
| `/module/operators?step=27` | "At Least 100 Points!" (>= with the level gate) |
| `/module/operators?step=28` | "Understanding the Maximum Limit" (<= with the ride) |
| `/module/operators?step=29` | "A Comparison Produces an Answer" (True or False, Boolean) |
| `/module/operators?step=30` | "Read, Understand and Evaluate" (four expressions: read, then True or False) |
| `/module/operators?step=31` | "Choose the Right Operation" (nine situations; skipped after clean 18 and 30) |
| `/module/operators?step=32` | "Construct the Expression" (150 - (4 * 25 + 3 * 10), then 120 - 130) |
| `/module/operators?step=33` | "Create a Shopping Calculator" (put the steps in order) |
| `/module/operators?step=34` | "Build a Budget Checker" (total_bill <= 500) |
| `/module/operators?step=35` | "The Incorrect Shopping Bill" (find the mistake, then fix it) |
| `/module/operators?step=36` | "The Boundary Bug" (score > 100 to score >= 100) |
| `/module/operators?step=37` | "Plan a Class Trip" (// % * <= in five questions) |
| `/module/operators?step=38` | "Why Did You Choose These Operations?" (six reasoning picks) |
| `/module/operators?step=39` | "You Can Now Make Values Work!" (the toolkit of 13 operators) |
| `/module/operators?step=40` | "From Calculation to Decision" (then the gem popup) |
| `/module/operators?step=complete` | "Lesson complete!" |

## Conditions module

Built from the "6. Conditions" spec: one step for each of its 38 screens (the step number is the PDF's screen number; a screen with several parts has several stages on the one step). The design is the Sequence and Command modules': Hex's short line, option rows or tiles with a picture, and the Hex result panel. The wording is shortened from the PDF, and no `if`/`else` is taught. `step` numbers are `STEP` in `components/conditions/conditions.ts`.

| Route | Screen |
|---|---|
| `/module/conditions?step=1` | "How Does a Computer Know It's Correct?" (marks vs the pass mark, then four test values) |
| `/module/conditions?step=2` | "A Condition Is Something We Check" |
| `/module/conditions?step=3` | "Can a Statement Be True and False?" (reveal, then predict) |
| `/module/conditions?step=4` | "Information Is Not a Condition" |
| `/module/conditions?step=5` | "A Condition Is Constructed" (the seven-step path, then put the steps in order) |
| `/module/conditions?step=6` | "What Makes a Number Positive?" (number line) |
| `/module/conditions?step=7` | "The Positive-Number Condition" (number > 0: build, then test) |
| `/module/conditions?step=8` | "What Makes a Number Negative?" (number < 0; skipped after a clean 7) |
| `/module/conditions?step=9` | "Is the Number Equal to 7?" (== and =) |
| `/module/conditions?step=10` | "What About Every Number Except 7?" (!=; skipped after a clean 9) |
| `/module/conditions?step=11` | "What Does “At Least 10” Mean?" (>=) |
| `/module/conditions?step=12` | "What Does “At Most 10” Mean?" (<=; skipped after a clean 11) |
| `/module/conditions?step=13` | "How Can We Spot an Even Number?" (share into two groups) |
| `/module/conditions?step=14` | "How Do We Check What Remains?" (number % 2 == 0) |
| `/module/conditions?step=15` | "What Happens When a Number Is Odd?" (number % 2 != 0; skipped after a clean 14) |
| `/module/conditions?step=16` | "Can You Build the Condition?" (four challenges; hints on the first two) |
| `/module/conditions?step=17` | "What If One Requirement Is Not Enough?" (dessert order, all four combinations) |
| `/module/conditions?step=18` | "When Are Both Requirements True?" (AND table, `ice_cream and pastry`) |
| `/module/conditions?step=19` | "When Is the Extra Class On?" (Anjali or Ravi) |
| `/module/conditions?step=20` | "Does OR Need Everyone?" (OR table, `anjali_comes or ravi_comes`) |
| `/module/conditions?step=21` | "One Word Changes Everything!" (AND vs OR; skipped after clean 18 and 20) |
| `/module/conditions?step=22` | "Is a Number in a Range?" (number line) |
| `/module/conditions?step=23` | "Both Boundaries Included" (>= 10 and <= 20) |
| `/module/conditions?step=24` | "What If 20 Is Not Allowed?" (>= 10 and < 20) |
| `/module/conditions?step=25` | "What If Neither Boundary Is Allowed?" (> 10 and < 20, then pick the condition; skipped after a clean 24) |
| `/module/conditions?step=26` | "What If a Number Is Outside 10 to 20?" (< 10 or > 20) |
| `/module/conditions?step=27` | "What Happens When We Reverse a Statement?" |
| `/module/conditions?step=28` | "How Do We Reverse a Condition?" (`not ravi_comes`, truth table) |
| `/module/conditions?step=29` | "What If a Number Is NOT Greater Than 10?" (`not (number > 10)`; skipped after a clean 28) |
| `/module/conditions?step=30` | "Can One Condition Hold Two Requirements?" (marks and attendance) |
| `/module/conditions?step=31` | "What If Either One Is Enough?" (score == 100 or bonus) |
| `/module/conditions?step=32` | "What If a Requirement Has Groups?" (parentheses) |
| `/module/conditions?step=33` | "Can You Translate This Requirement?" (workshop eligibility) |
| `/module/conditions?step=34` | "Can You Find What Is Wrong?" (boundary bug) |
| `/module/conditions?step=35` | "Does This Condition Fit the Rule?" (and/or bug; skipped after a clean 34) |
| `/module/conditions?step=36` | "You Are the Condition Designer!" (eight builds) |
| `/module/conditions?step=37` | "You Can Now Construct Conditions!" (toolkit, then "Complete Chapter" opens the gem popup) |
| `/module/conditions?step=38` | "What Comes Next?" (three condition cards and the "Selection / Decision Making" pathway; Continue ends the lesson) |
| `/module/conditions?step=complete` | "Lesson complete!" |

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
| Variable module: skips | Screens 11, 21 and 24 are skipped (and Back skips them) when the screens they repeat were answered right the first time with no hint |
| Variable module: detours | A learner who misses (or uses the hint on) 8, 10, 14, 16, 20, 21, 23, 24, 27 or 28 is sent once to the screen that taught the idea (7, 13, 19, 8, 10, 26, 20), then on from the screen after the one they missed |
| Data Types module: skips | Screens 15, 20 and the five reflection screens (25-29) are skipped (and Back skips them) when the screens they repeat were answered right the first time with no hint (see `SKIPS` in `components/datatypes/datatypes.ts`) |
| Data Types module: detours | A learner who misses (or uses the hint on) a screen is sent once to the earlier screen that taught the idea, then on from the screen after the one they missed (see `DETOURS`) |
| Data Types module: score and branches | Kept in session storage (`lingo.datatypes-*`), cleared when the module is opened from the path |
| Variable module: score and branches | Kept in session storage (`lingo.variable-*`), cleared when the module is opened from the path |
| Operators module: skips | Screens 20, 23, 24, 30 and 31 are skipped (and Back skips them) when the screens they repeat were answered right the first time with no hint (see `SKIPS` in `components/operators/operators.ts`; a skipped screen counts as answered for the skips after it) |
| Operators module: detours | A learner who misses (or uses the hint on) a screen is sent once to the earlier screen that taught the idea, then on from the screen after the one they missed (see `DETOURS`). Screen 13 goes back to 12 (as the spec says); screen 38 goes to 12 for trouble with the remainder questions and to 26 for trouble with the comparison ones |
| Operators module: score and branches | Kept in session storage (`lingo.operators-*`), cleared when the module is opened from the path |
| Conditions module: skips | Screens 8, 10, 12, 15, 21, 25, 29 and 35 are skipped (and Back skips them) when the screens they repeat were answered right the first time with no hint (see `SKIPS` in `components/conditions/conditions.ts`; a skipped screen counts as answered for the skips after it) |
| Conditions module: detours | A learner who misses (or uses the hint on) a screen is sent once to the earlier screen that taught the idea, then on from the screen after the one they missed (see `DETOURS`). Screen 16 goes to 14 for trouble with the divisibility challenges and to 7 for the comparison ones |
| Conditions module: ending | "Complete Chapter" on 37 opens the gem popup; closing it opens screen 38, whose Continue ends on "Lesson complete!" |
| Conditions module: score and branches | Kept in session storage (`lingo.conditions-*`), cleared when the module is opened from the path |
| `/module` with no params | Opens Level 1, step 1 |
| Any other level or step | 404 (only Level 1 exists so far) |
| Adding an onboarding step | Its `?step=` name is its id from `ONBOARDING_STEPS`, in kebab-case |

# Variable module: pictures still to come

The Variable module is drawn in code wherever it can be (the bottle, wallet, classroom, price tags, name/value cards, calculator). A few scenes and characters can't be, so each is a **placeholder** (an emoji and a label in a dashed box) until the real picture is added.

To replace one, save the picture as `public/images/variable/<name>.webp`. Nothing else changes: the placeholder uses the file as soon as it is there.

| File name | Where | What it should show | Drawn at (px) |
|---|---|---|---|
| `trek-trail.webp` | step 1 | A mountain trail with students walking; one looks excited; mountains, trees and a bright sky, slightly zoomed out | 300 x 112 |
| `thirsty-student.webp` | step 2 | One student pauses and looks thirsty, with a small water droplet near them; the others walk on | 220 x 96 |
| `drinking-student.webp` | step 2 (hint), step 5 | A student drinking water from a bottle | 150 x 84 (step 2), 110 x 84 (step 5) |
| `no-water-trail.webp` | step 3 | Students on a mountain trail with no water source nearby; a thought bubble over one | 300 x 104 |

The `Art` component is in `src/components/variable/visuals.tsx`.

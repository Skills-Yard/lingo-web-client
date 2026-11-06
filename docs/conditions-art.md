# Conditions module: pictures

The Conditions module has no art of its own. Its cards and answers use the **stand-ins** of the Operators module (`src/components/operators/pictures.ts`, `P`), which come from the Sequence and Command modules. See [operators-art.md](operators-art.md) for the table and for how to swap in real pictures (change the one line in `P`; every screen that shows it follows).

Everything else is drawn in code:

- `src/components/conditions/visuals.tsx`: the question-to-check-to-True/False flow, the True/False result cards, the number line around zero, and the range lines (filled or open ends, or the outside of a range).
- `src/components/conditions/interactions.tsx`: predict-the-result rows, the combination explorer (dessert order, Anjali and Ravi, the reversed statement), the reveal tables (truth tables), the step-by-step path and the share-into-two-groups experiment.
- The expression builder and the ordering interaction are shared from the Operators module (`components/operators/interactions.tsx`); the words `and`, `or` and `not` are drawn as operators in it.

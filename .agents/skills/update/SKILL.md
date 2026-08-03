---
name: update
description: 'Update a built-in Recipe Table Studio recipe from the newest open GitHub issue in this repository. Use when the user says "update", "update now", or asks to process a `[Recipe Preset: Update]` issue.'
---

# Recipe Preset Update

## Meaning of `update`

Interpret a bare `update` in this repository as: find the newest open
`[Recipe Preset: Update]` issue in `DannyDelott/recipe-table-studio` and apply
its submitted recipe to the matching built-in preset.

Keep the operation scoped to an existing preset update. Do not treat a
`[Recipe Preset: New]` issue as an update, and do not close issues, commit,
push, or open a PR unless the user separately asks for publication.

## Workflow

1. Inspect the local branch and working tree before changing anything. Preserve
   unrelated user changes. If the branch is behind `origin/main`, fetch the
   current main ref and safely fast-forward or rebase as needed so the target
   preset file and registry are present; never discard dirty files.

2. Find the newest open issue with the exact title prefix
   `[Recipe Preset: Update]`. Prefer the connected GitHub issue search and issue
   fetch tools; use `gh issue list` and `gh issue view` only when connector
   coverage is unavailable. Fetch the complete issue body and confirm it is
   still open.

3. Extract the JSON code block from the issue. Validate the submitted wrapper
   with `parseRecipeFile` from `src/recipe-backup.js`; install dependencies with
   `npm ci` first when `node_modules` is absent. Require the supported format and
   version, unique action IDs, valid ingredient-line bounds, and backward-only
   `sourceIds`. Never silently repair malformed issue content.

4. Search `recipes/*.recipe.json` for exactly one file whose `recipe.id` equals
   the issue's existing preset ID. Confirm the existing title also matches the
   issue. If no file or more than one file matches, stop and report the mismatch;
   an update issue must not create a new preset or guess a target.

5. Replace that existing recipe file with the validated submitted wrapper. Keep
   the filename, recipe ID, action IDs, and submitted copy exactly as supplied.

6. Update `src/built-in-recipes.js` if the target is not already registered,
   preserve the production shelf order, and increment
   `BUILT_IN_RECIPE_VERSION` exactly once. Add or update focused assertions in
   `test/built-in-recipes.test.js` covering the changed recipe's ID, title,
   ingredients, note, and complete action structure.

7. Run all required gates from the repository instructions:

   ```sh
   npm test
   npm run build
   git diff --check
   ```

8. Report the issue number, preset file, preserved ID, new built-in version, and
   verification results. Leave the GitHub issue open unless the user explicitly
   requests issue or publication management.

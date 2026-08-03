---
name: update
description: 'Process the newest open Recipe Table Studio preset issue from GitHub, whether it adds a new recipe or updates an existing one. Use when the user says "update", "update now", or asks to process a `[Recipe Preset: New]` or `[Recipe Preset: Update]` issue.'
---

# Recipe Preset Issue Processor

## Meaning of `update`

Interpret a bare `update` in this repository as: find the newest open issue
with either `[Recipe Preset: New]` or `[Recipe Preset: Update]` in
`DannyDelott/recipe-table-studio`, classify it from its title/body, and apply
its submitted recipe to the built-in library.

Process one newest matching issue per bare invocation. If the user explicitly
asks to process all matching issues, process them in tracker creation order,
one issue at a time, and bump the built-in version once per issue. Do not close
issues, commit, push, or open a PR unless the user separately asks for
publication.

## Workflow

1. Inspect the local branch and working tree before changing anything. Preserve
   unrelated user changes. If the branch is behind `origin/main`, fetch the
   current main ref and safely fast-forward or rebase as needed so the target
   preset file and registry are present; never discard dirty files.

2. Find the newest open issue whose exact title prefix is either
   `[Recipe Preset: Update]` or `[Recipe Preset: New]`; compare creation times
   across both types rather than searching only one prefix. Prefer the
   connected GitHub issue search and issue fetch tools; use `gh issue list` and
   `gh issue view` only when connector coverage is unavailable. Fetch the
   complete issue body and confirm it is still open.

3. Extract the JSON code block from the issue. Validate the submitted wrapper
   with `parseRecipeFile` from `src/recipe-backup.js`; install dependencies with
   `npm ci` first when `node_modules` is absent. Require the supported format and
   version, unique action IDs, valid ingredient-line bounds, and backward-only
   `sourceIds`. Never silently repair malformed issue content.

4. Classify and validate the target before writing:

   - For `[Recipe Preset: Update]`, require the existing preset ID and title
     from the issue. Search `recipes/*.recipe.json` for exactly one file whose
     `recipe.id` matches that ID, and confirm its title matches too. If no file
     or more than one file matches, stop and report the mismatch; an update
     issue must not create a new preset or guess a target.
   - For `[Recipe Preset: New]`, require the issue to mark the existing preset
     as absent. Confirm that no recipe file has the submitted ID and no built-in
     preset has the submitted title. Derive a lowercase kebab-case slug from
     the submitted title and confirm `recipes/<slug>.recipe.json` does not
     already exist. If the ID, title, or filename collides, stop and report it
     rather than guessing.

5. Apply the validated wrapper exactly as supplied:

   - For an update, replace the existing recipe file while keeping its filename,
     recipe ID, action IDs, and submitted copy.
   - For a new preset, create `recipes/<slug>.recipe.json` with the submitted
     wrapper, preserving its recipe ID, action IDs, and copy.

6. Update `src/built-in-recipes.js`: for a new preset, add its JSON import and
   put it at the front of `productionRecipeFiles`; for an update, preserve its
   existing shelf position. Increment `BUILT_IN_RECIPE_VERSION` exactly once.
   Add or update focused assertions in `test/built-in-recipes.test.js` covering
   the issue type, shelf position/count, recipe ID, title, ingredients, note,
   and complete action structure.

7. Run all required gates from the repository instructions:

   ```sh
   npm test
   npm run build
   git diff --check
   ```

8. Report the issue type and number, preset file, whether the recipe was added
   or replaced, its ID, the new built-in version, and verification results.
   Leave the GitHub issue open unless the user explicitly requests issue or
   publication management.

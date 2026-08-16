---
name: update
description: 'Process and ship the newest open Recipe Table Studio preset issue from GitHub, whether it adds a new recipe or updates an existing one. Use when the user says "update", "update now", or asks to process a `[Recipe Preset: New]` or `[Recipe Preset: Update]` issue.'
---

# Recipe Preset Issue Processor

## Meaning of `update`

Interpret a bare `update` in this repository as: find the newest open issue
with either `[Recipe Preset: New]` or `[Recipe Preset: Update]` in
`DannyDelott/recipe-table-studio`, classify it from its title/body, and apply
its submitted recipe to the built-in library, then ship it through production.

Process one newest matching issue per bare invocation. If the user explicitly
asks to process all matching issues, process them in tracker creation order,
one issue at a time, and bump the built-in version once per issue. A bare
`update` includes publication: commit the scoped changes, push a branch, open a
ready-for-review PR, merge it, verify the exact merge commit deployed to GitHub
Pages and the live site returns HTTP 200, then comment on and close each
processed issue.

## Workflow

1. Inspect the local branch and working tree before changing anything. Preserve
   unrelated user changes. If the branch is behind `origin/main`, fetch the
   current main ref and safely fast-forward or rebase as needed so the target
   preset file and registry are present; never discard dirty files.

2. Find the newest open issue authored by `DannyDelott` whose exact title
   prefix is either `[Recipe Preset: Update]` or `[Recipe Preset: New]`; compare
   creation times across both types rather than searching only one prefix.
   Never process a preset issue from another author unless the user explicitly
   approves that exact issue. Prefer the connected GitHub issue search and
   issue fetch tools; use `gh issue list` and `gh issue view` only when connector
   coverage is unavailable. Fetch the complete issue body, confirm it is still
   open, and verify its author before extracting the submitted JSON.

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

8. Commit only the scoped recipe, registry, and test changes, preserving any
   unrelated worktree changes. Push the branch and open a ready-for-review PR
   against `main` with the processed issue numbers in its description.

9. Confirm the PR is mergeable, merge it using the repository's normal merge
   commit method, and capture the exact merge commit SHA. Do not treat a green
   local build or a merged PR as proof of production deployment.

10. Wait for the GitHub Pages deployment associated with that exact merge
    commit to succeed, then verify the live Recipe Table Studio site returns
    HTTP 200. Only after both checks pass, comment on each processed issue with
    the PR and deployment result and close it as completed.

11. Report the issue type and number, preset file, whether the recipe was added
    or replaced, its ID, the new built-in version, verification results, PR,
    merge commit, production deployment, and issue closure.

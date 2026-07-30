# Gingerbread Muffins Preset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the Gingerbread Muffins recipe submitted in GitHub issue #50 as a built-in preset.

**Architecture:** Validate the issue's JSON through the repository recipe parser before saving it verbatim as a new preset file. Import the preset into the built-in shelf after the more recently submitted Pumpkin Muffins recipe, bump the seed version, and add complete regression coverage.

**Tech Stack:** JavaScript, Node.js test runner, Vite, JSON recipe files

## Dependency Chain

```text
Task 1 (validate, add, verify, and publish)
```

---

### Task 1: Add the Gingerbread Muffins built-in preset

**Files:**
- Create: `recipes/gingerbread-muffins.recipe.json`
- Modify: `src/built-in-recipes.js`
- Test: `test/built-in-recipes.test.js`

**Step 1: Install dependencies**

Run: `npm ci`

Expected: dependencies install successfully from `package-lock.json`.

**Step 2: Validate the submitted recipe JSON**

Parse the issue #50 JSON with `parseRecipeFile` from `src/recipe-backup.js`, then confirm:

- the format and version are supported;
- recipe ID `1785369418583-e8ewd` does not exist in `recipes/`;
- title `Gingerbread Muffins` does not conflict with an existing preset;
- all action IDs are unique;
- ingredient line numbers are in bounds;
- every `sourceIds` reference points backward to an earlier action.

Expected: the submitted recipe passes without repair or normalization.

**Step 3: Write the failing regression expectations**

Update the shelf-order expectation to include Gingerbread Muffins after Pumpkin Muffins, change the expected built-in version from `16` to `17`, update the library-size assertion from 9 to 10, and assert the complete submitted recipe.

Run: `node --test test/built-in-recipes.test.js`

Expected: FAIL because the new preset import, file, and version do not exist yet.

**Step 4: Add the exact preset and built-in registration**

Save the exact issue JSON as `recipes/gingerbread-muffins.recipe.json`. Import it in `src/built-in-recipes.js`, place it after Pumpkin Muffins in `productionRecipeFiles`, and change `BUILT_IN_RECIPE_VERSION` from `16` to `17`.

**Step 5: Verify the focused and full test suites**

Run: `node --test test/built-in-recipes.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests pass.

**Step 6: Verify the production build and patch**

Run: `npm run build`

Expected: Vite production build succeeds.

Run: `git diff --check`

Expected: no whitespace errors.

**Step 7: Commit and open the pull request**

```bash
git add docs/plans/2026-07-30-add-gingerbread-muffins.md \
  recipes/gingerbread-muffins.recipe.json \
  src/built-in-recipes.js \
  test/built-in-recipes.test.js
git commit -m "Add Gingerbread Muffins preset"
git push -u origin codex/add-gingerbread-muffins
gh pr create \
  --title "Add Gingerbread Muffins preset" \
  --body "Tracks #50; close after deployment verification." \
  --base main
```

Expected: a ready-for-review pull request targets `main`. Merge it only when GitHub reports it mergeable, then verify the Pages deployment for the exact merge commit and the live site before closing issue #50.

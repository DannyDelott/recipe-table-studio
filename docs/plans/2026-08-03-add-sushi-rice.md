# Sushi Rice Preset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the four-rice-cooker-cup Sushi Rice recipe submitted in GitHub issue #58 as a built-in preset.

**Architecture:** Validate the issue JSON through the repository recipe parser before saving it unchanged as a new preset file. Register it at the front of the built-in shelf, bump the seed version, and add complete regression coverage for its ingredients and action graph.

**Tech Stack:** JavaScript, Node.js test runner, Vite, JSON recipe files

## Dependency Chain

```text
Task 1 (validate, add, verify, and publish)
```

---

### Task 1: Add the Sushi Rice built-in preset

**Files:**
- Create: `recipes/sushi-rice.recipe.json`
- Modify: `src/built-in-recipes.js`
- Test: `test/built-in-recipes.test.js`

**Step 1: Install dependencies**

Run: `npm ci`

Expected: dependencies install successfully from `package-lock.json`.

**Step 2: Validate the submitted recipe JSON**

Parse the issue #58 JSON with `parseRecipeFile` from `src/recipe-backup.js`, then confirm:

- the format and version are supported;
- recipe ID `1785770600523-rx2nw` does not exist in `recipes/`;
- title `Sushi Rice` does not conflict with an existing preset;
- all action IDs are unique;
- ingredient line numbers are in bounds;
- every `sourceIds` reference points backward to an earlier action.

Expected: the submitted recipe passes without repair or normalization.

**Step 3: Write the failing regression expectations**

Update the shelf-order expectation to include Sushi Rice first, change the expected built-in version from `18` to `19`, update the library-size assertions from 10 to 11, and assert the complete submitted recipe.

Run: `node --test test/built-in-recipes.test.js`

Expected: FAIL because the new preset import, file, and version do not exist yet.

**Step 4: Add the exact preset and built-in registration**

Save the exact issue JSON as `recipes/sushi-rice.recipe.json`. Import it in `src/built-in-recipes.js`, place it first in `productionRecipeFiles`, and change `BUILT_IN_RECIPE_VERSION` from `18` to `19`.

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
git add docs/plans/2026-08-03-add-sushi-rice.md \
  recipes/sushi-rice.recipe.json \
  src/built-in-recipes.js \
  test/built-in-recipes.test.js
git commit -m "Add Sushi Rice preset"
git push -u origin codex/add-sushi-rice
gh pr create \
  --title "Add Sushi Rice preset" \
  --body "Tracks #58; close after deployment verification." \
  --base main
```

Expected: a ready-for-review pull request targets `main`. Merge it only when GitHub reports it mergeable, then verify the Pages deployment for the exact merge commit and the live site before closing issue #58.

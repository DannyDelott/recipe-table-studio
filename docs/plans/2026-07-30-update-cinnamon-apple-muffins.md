# Cinnamon Apple Muffins Preset Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the validated Cinnamon Apple Muffins preset submitted in GitHub issue #51 without changing its built-in recipe identity.

**Architecture:** Treat the issue's JSON payload as the source of truth, validate it through the repository's recipe parser, and replace the existing preset file with that exact payload. Bump the seeding version so saved installations receive the update, and update the built-in recipe regression test to assert the submitted action graph.

**Tech Stack:** JavaScript, Node.js test runner, Vite, JSON recipe files

## Dependency Chain

```text
Task 1 (validate, update, verify, and publish)
```

---

### Task 1: Update the Cinnamon Apple Muffins built-in preset

**Files:**
- Modify: `recipes/cinnamon-apple-muffins.recipe.json`
- Modify: `src/built-in-recipes.js`
- Test: `test/built-in-recipes.test.js`

**Step 1: Install dependencies**

Run: `npm ci`

Expected: dependencies install successfully from `package-lock.json`.

**Step 2: Validate the submitted recipe JSON**

Parse the issue #51 JSON with `parseRecipeFile` from `src/recipe-backup.js`, then confirm:

- the format and version are supported;
- recipe ID `cinnamon-apple-muffins` matches exactly one file in `recipes/`;
- all action IDs are unique;
- ingredient line numbers are in bounds;
- every `sourceIds` reference points backward to an earlier action.

Expected: the submitted recipe passes without repair or normalization.

**Step 3: Write the failing regression expectation**

Change the expected built-in version from `14` to `15` and change the expected `egg-mixture` action text from `Add one at a time, mix fully after each` to `Add one at a time, mix fully`.

Run: `node --test test/built-in-recipes.test.js`

Expected: FAIL because the preset and version still contain the old values.

**Step 4: Apply the preset update**

Replace `recipes/cinnamon-apple-muffins.recipe.json` with the exact JSON payload from issue #51 and change `BUILT_IN_RECIPE_VERSION` from `14` to `15` in `src/built-in-recipes.js`.

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
git add docs/plans/2026-07-30-update-cinnamon-apple-muffins.md \
  recipes/cinnamon-apple-muffins.recipe.json \
  src/built-in-recipes.js \
  test/built-in-recipes.test.js
git commit -m "Update Cinnamon Apple Muffins preset"
git push -u origin codex/update-cinnamon-apple-muffins
gh pr create \
  --title "Update Cinnamon Apple Muffins preset" \
  --body "Closes #51" \
  --base main
```

Expected: a ready-for-review pull request targets `main`. Merge it only when GitHub reports it mergeable, then verify the Pages deployment for the exact merge commit and the live site before closing issue #51.

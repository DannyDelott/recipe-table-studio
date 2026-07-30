# Pumpkin Muffins Preset Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the revised Pumpkin Muffins preset submitted in GitHub issue #56 without creating a duplicate recipe.

**Architecture:** Treat the recipe ID as authoritative despite the issue's incorrect “New” label, validate the payload against the existing built-in preset, and replace that preset verbatim. Bump the seed version and update complete regression coverage so installations receive the revised ingredient wording.

**Tech Stack:** JavaScript, Node.js test runner, Vite, JSON recipe files

## Dependency Chain

```text
Task 1 (validate, update, verify, and publish)
```

---

### Task 1: Update the Pumpkin Muffins built-in preset

**Files:**
- Modify: `recipes/pumpkin-muffins.recipe.json`
- Modify: `src/built-in-recipes.js`
- Test: `test/built-in-recipes.test.js`

**Step 1: Install dependencies**

Run: `npm ci`

Expected: dependencies install successfully from `package-lock.json`.

**Step 2: Validate the submitted recipe JSON**

Parse issue #56 with `parseRecipeFile` and confirm ID `1785425059211-8ggsy` matches exactly one existing preset, every action ID is unique, ingredient references are in bounds, and source references point backward.

Expected: the payload passes without repair. The issue is handled as an update despite its “New” label.

**Step 3: Write the failing regression expectations**

Change the expected built-in version from `17` to `18` and remove gram amounts from the expected sugar, brown sugar, and pumpkin puree ingredient lines.

Run: `node --test test/built-in-recipes.test.js`

Expected: FAIL because the current preset and version still contain the old values.

**Step 4: Apply the exact preset update**

Replace `recipes/pumpkin-muffins.recipe.json` with the exact issue #56 JSON and change `BUILT_IN_RECIPE_VERSION` from `17` to `18`.

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
git add docs/plans/2026-07-30-update-pumpkin-muffins.md \
  recipes/pumpkin-muffins.recipe.json \
  src/built-in-recipes.js \
  test/built-in-recipes.test.js
git commit -m "Update Pumpkin Muffins preset"
git push -u origin codex/update-pumpkin-muffins
gh pr create \
  --title "Update Pumpkin Muffins preset" \
  --body "Tracks #56; close after deployment verification." \
  --base main
```

Expected: a ready-for-review pull request targets `main`. Merge it only when GitHub reports it mergeable, then verify the Pages deployment for the exact merge commit and the live site before closing issue #56.

# Built-in Recipe Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the six recipes exported from the production GitHub Pages app as a non-destructive built-in library.

**Architecture:** Keep the production `.recipe.json` exports as the canonical recipe fixtures. Load and validate them through the existing recipe-file parser, then merge missing built-ins into browser storage once per built-in library version so existing recipes are never overwritten and deleted built-ins do not reappear.

**Tech Stack:** Vite 7, browser `localStorage`, JavaScript modules, Node test runner.

## Dependency Chain

```text
Task 1 (production exports) → Task 2 (pure merge module) → Task 3 (startup seeding) → Task 4 (browser verification)
```

---

### Task 1: Add the production recipe exports

**Files:**

- Replace: `recipes/banana-bread.recipe.json`
- Replace: `recipes/carrot-cake.recipe.json`
- Create: `recipes/cinnamon-apple-muffins.recipe.json`
- Create: `recipes/irish-soda-bread.recipe.json`
- Create: `recipes/lemon-bars.recipe.json`
- Create: `recipes/zucchini-bread.recipe.json`

1. Copy the six files from the production **Export All** ZIP without rewriting recipe IDs, action IDs, copy, or timestamps.
2. Parse every file with the existing `parseRecipeFile` function.
3. Confirm the titles are Lemon Bars, Cinnamon Apple Muffins, Irish Soda Bread, Carrot Cake, Zucchini Bread, and Banana Bread.

### Task 2: Build and test the built-in merge module

**Files:**

- Create: `src/built-in-recipes.js`
- Create: `test/built-in-recipes.test.js`

1. Write a failing test asserting the module exposes the six production recipes in shelf order.
2. Write a failing test asserting a saved recipe with a built-in ID wins over the bundled copy.
3. Write a failing test asserting missing built-ins are appended once and a second merge is idempotent.
4. Statically import the six JSON files and validate each wrapper with `parseRecipeFile`.
5. Implement an ID-based non-destructive merge.
6. Run `node --test test/built-in-recipes.test.js`; expect all tests to pass.

### Task 3: Seed built-ins once during startup

**Files:**

- Modify: `src/main.js`
- Modify: `test/built-in-recipes.test.js`

1. Add a versioned local-storage key for the built-in library.
2. Preserve the existing draft-to-library migration before seeding.
3. If the stored built-in version is old, append only missing built-in IDs and store the current version.
4. Do not seed again after that version is recorded, allowing users to delete built-ins normally.
5. Keep the active recipe selection logic unchanged after the merged library is available.

### Task 4: Verify the shipped experience

**Files:**

- Verify: `src/main.js`
- Verify: `recipes/*.recipe.json`

1. Run `npm test`; expect the full suite to pass.
2. Run `npm run build`; expect Vite to bundle the six recipe modules.
3. Open a fresh local origin and confirm the Recipes count is 6.
4. Open Cinnamon Apple Muffins and confirm its branched preview uses the corrected layout.
5. Keep the local Vite URL open for the user.

Publishing is intentionally outside this local implementation request. When requested, stage the listed files, commit, push a `codex/` branch, and open a ready-for-review PR against `main`.

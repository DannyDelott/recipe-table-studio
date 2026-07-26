# Recipe Backup Import and Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let people download recipes as individual versioned JSON files and safely import one recipe file back into the browser at a time.

**Architecture:** Keep recipe-file parsing and merging in a small browser-independent module so malformed files can be tested without the DOM. Export sits beside Save Recipe, Import Recipe sits in the Recipes header, and Export All creates a ZIP containing one importable JSON file per shelf recipe; imports merge by recipe ID and never remove recipes already in local storage.

**Tech Stack:** Vanilla JavaScript, Vite, Node test runner, daisyUI button components, fflate, browser `Blob`, `File`, and download APIs

## Dependency Chain

```
Task 1 (backup format and tests) → Task 2 (Recipes header controls) → Task 3 (browser wiring and verification)
```

---

### Task 1: Versioned backup module

**Files:**
- Create: `src/recipe-backup.js`
- Create: `test/recipe-backup.test.js`

1. Write failing tests for single-recipe serialization metadata, malformed JSON, unsupported versions, invalid recipe records, collection files, and non-destructive merge behavior.
2. Run `npm test` and confirm the new tests fail because the module is missing.
3. Implement `createRecipeBackup`, `parseRecipeBackup`, and `mergeRecipeLibraries`.
4. Run `npm test` and confirm all backup and table-layout tests pass.
5. Commit the module and tests with `git commit -m "Add recipe backup format"`.
6. Push the task branch and open a ready-for-review PR referencing this plan.

### Task 2: Compact backup controls

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

1. Add Import Recipe and Export All buttons with recognizable upload/download icons to the Recipes header.
2. Add Export beside Save Recipe in the Preview header.
3. Add a visually hidden JSON file input and an `aria-live` status message.
4. Match the existing light green-bordered button treatment and preserve the compact dashboard layout on mobile.
5. Run `npm run build`.
6. Commit the UI with `git commit -m "Add recipe backup controls"`.
7. Push the task branch and open a ready-for-review PR referencing this plan.

### Task 3: Download, restore, and document

**Files:**
- Modify: `src/main.js`
- Modify: `README.md`

1. Wire Export to download the current preview as one named recipe `.json` file.
2. Wire Export All to download one ZIP containing an individual recipe file for each shelf recipe.
3. Wire Import Recipe to read one JSON file, validate it, merge the recipe by ID, rerender the shelf, and report whether it was added or updated.
4. Keep existing recipes when importing and leave the current editor draft untouched.
5. Document the recipe-file workflow and local-storage limitation in the README.
6. Run `npm test` and `npm run build`.
7. Verify the controls, disabled state, valid import, invalid import, and recipe counts in the local browser.
8. Commit with `git commit -m "Finish recipe import and export"`.
9. Push the task branch and open a ready-for-review PR referencing this plan.

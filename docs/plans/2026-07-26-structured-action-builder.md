# Structured Action Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace free-text action ranges with structured actions that select ingredient lines, reference earlier result groups, and generate the nested recipe table deterministically.

**Architecture:** Each action stores an ID, action text, selected ingredient line numbers, referenced earlier action IDs, and a result-group name. The renderer derives each cell's ingredient coverage recursively and assigns its table column from dependency depth, so nested “flagpole” cells come from explicit recipe relationships rather than text heuristics.

**Tech Stack:** Vite, vanilla JavaScript, Tailwind CSS 4, daisyUI 5, browser-based DOM and visual verification.

## Dependency Chain

```text
Task 1 (structured data model) → Task 2 (action builder UI) → Task 3 (graph renderer) → Task 4 (migration and persistence) → Task 5 (visual verification)
```

### Task 1: Structured action data model

**Files:**
- Modify: `src/main.js`

1. Define structured Banana Bread action fixtures.
2. Add normalization for action IDs, ingredients, group references, and group names.
3. Add graph calculation for recursive ingredient coverage and dependency depth.
4. Verify the Banana Bread graph produces depths 0–4 and spans 1–2, 1–5, 6–8, 1–8, 1–9, and 1–9.

### Task 2: Action builder UI

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

1. Replace the action textarea with an ordered action-card list.
2. Add a prominent “Add action” button.
3. Add ingredient checkbox buttons showing line number and ingredient text.
4. Add earlier-group checkbox buttons showing result-group names.
5. Add action text and result-group inputs.
6. Add move and remove controls with accessible labels.

### Task 3: Graph-based table renderer

**Files:**
- Modify: `src/main.js`

1. Remove action-text layout heuristics.
2. Render action cells by graph depth and recursive ingredient coverage.
3. Merge empty cells horizontally and vertically.
4. Preserve Cooking for Engineers-style hidden joins at full-height flagpoles.

### Task 4: Migration and persistence

**Files:**
- Modify: `src/main.js`

1. Save structured actions in drafts and recipe-library entries.
2. Migrate old range-based recipes to structured actions.
3. Preserve the exact Banana Bread graph during migration.
4. Update recipe-card action counts and load/save flows.

### Task 5: Verification

**Files:**
- Verify: `src/main.js`
- Verify: `src/style.css`

1. Run `npm run build` and expect a successful Vite build.
2. Enter the Banana Bread graph through the structured editor.
3. Assert the rendered action rowspans and dependency columns in the browser.
4. Capture the preview and compare it visually with the supplied Banana Bread reference.

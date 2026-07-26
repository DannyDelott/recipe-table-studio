# Recipe Table Studio

A browser-only recipe formatter inspired by Cooking for Engineers. It turns an
ingredient list and a structured sequence of actions into a compact,
print-ready recipe table.

Live site: [dannydelott.github.io/recipe-table-studio](https://dannydelott.github.io/recipe-table-studio/)

## Run it

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173/`).

## Features

- A numbered ingredient editor that keeps recipe references easy to verify
- Structured action cards that can use ingredients and the result groups from
  earlier actions
- A live table preview with calculated row and column spans
- A recipe shelf with ingredient lists and miniature table previews
- Browser-local recipe storage with named deletion confirmation
- Versioned JSON backups that can be exported and safely imported later
- Clean print output containing only the finished recipe table

## Use it

1. Enter one ingredient per line.
2. Add actions and select the ingredients or earlier result groups they use.
3. Name each result group so later actions can reference it.
4. Select **Save Recipe** to add or update the recipe on the shelf.
5. Select **Print** for the clean printable version.

Recipes are stored in the current browser with `localStorage`; no account or
server is required.

## Back up your recipes

Select **Export** beside **Save Recipe** to download the recipe currently in the
preview as its own `.recipe.json` file.

Select **Export All** beside the Recipes heading to download one ZIP containing
a separate, importable recipe file for every recipe on the shelf.

Select **Import Recipe** and choose one extracted `.recipe.json` file to restore
it. Imports are non-destructive: a new recipe is added, a recipe with a matching
ID is updated, and every other recipe already on the shelf is kept.

The `recipes/` directory contains source-controlled exports of the recipes that
ship with this repository.

## Verify

```sh
npm test
npm run build
```

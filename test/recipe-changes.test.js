import assert from 'node:assert/strict'
import test from 'node:test'

import {
  editableRecipeContent,
  findBuiltInPresetForLoadedRecipe,
  recipeHasResettableChanges,
  recipeHasChanges,
  resetRecipeInLibrary,
} from '../src/recipe-changes.js'

const preset = {
  id: 'banana-bread',
  title: 'Banana Bread',
  note: 'Preheat oven to 325 degrees',
  ingredients: '1 cup flour\n1 egg',
  actions: [{
    id: 'mix',
    text: 'Mix',
    groupName: 'Batter',
    ingredientLines: [1, 2],
    sourceIds: [],
  }],
  updatedAt: 1700000000000,
}

test('ignores non-editable recipe metadata when comparing with a preset', () => {
  const localRecipe = {
    ...preset,
    updatedAt: 1800000000000,
    exportedAt: '2027-01-15T12:00:00.000Z',
  }

  assert.deepEqual(editableRecipeContent(localRecipe), editableRecipeContent(preset))
  assert.equal(recipeHasChanges(localRecipe, preset), false)
})

test('detects changes to every editable top-level recipe field', () => {
  for (const [field, value] of [
    ['title', 'Better Banana Bread'],
    ['note', 'Preheat oven to 350 degrees'],
    ['ingredients', '2 cups flour\n1 egg'],
  ]) {
    assert.equal(
      recipeHasChanges({ ...preset, [field]: value }, preset),
      true,
      `${field} should be treated as changed`,
    )
  }
})

test('detects action edits and action order changes', () => {
  const secondAction = {
    id: 'bake',
    text: 'Bake',
    groupName: 'Banana bread',
    ingredientLines: [],
    sourceIds: ['mix'],
  }
  const twoActionPreset = {
    ...preset,
    actions: [...preset.actions, secondAction],
  }

  assert.equal(recipeHasChanges({
    ...preset,
    actions: [{ ...preset.actions[0], groupName: 'Finished batter' }],
  }, preset), true)
  assert.equal(recipeHasChanges({
    ...twoActionPreset,
    actions: [secondAction, ...preset.actions],
  }, twoActionPreset), true)
})

test('recovers preset identity when a loaded browser copy has a different recipe ID', () => {
  const browserCopy = {
    ...preset,
    id: 'local-browser-copy',
  }

  assert.equal(
    findBuiltInPresetForLoadedRecipe(browserCopy, [preset]),
    preset,
  )
})

test('prefers persisted preset identity when the recipe title was edited', () => {
  const renamedBrowserCopy = {
    ...preset,
    id: 'local-browser-copy',
    presetId: preset.id,
    title: 'Grandma’s Banana Bread',
  }

  assert.equal(
    findBuiltInPresetForLoadedRecipe(renamedBrowserCopy, [preset]),
    preset,
  )
})

test('does not turn an explicitly new recipe into an update based on title alone', () => {
  const newRecipeWithReusedTitle = {
    ...preset,
    id: 'new-local-recipe',
    presetId: null,
  }

  assert.equal(
    findBuiltInPresetForLoadedRecipe(
      newRecipeWithReusedTitle,
      [preset],
      null,
      false,
    ),
    null,
  )
})

test('only enables reset when the active saved preset has local changes', () => {
  const changedRecipe = {
    ...preset,
    id: 'local-browser-copy',
    presetId: preset.id,
    note: 'Preheat oven to 350 degrees',
  }

  assert.equal(
    recipeHasResettableChanges(changedRecipe, changedRecipe, preset),
    true,
  )
  assert.equal(
    recipeHasResettableChanges(preset, changedRecipe, preset),
    true,
    'saved library changes remain resettable after the editor is manually reverted',
  )
  assert.equal(
    recipeHasResettableChanges(preset, preset, preset),
    false,
  )
  assert.equal(
    recipeHasResettableChanges(changedRecipe, null, preset),
    false,
    'a missing active library recipe cannot be reset',
  )
  assert.equal(
    recipeHasResettableChanges(changedRecipe, changedRecipe, null),
    false,
    'a new recipe has no built-in preset to restore',
  )
  assert.equal(
    recipeHasResettableChanges(changedRecipe, {
      ...changedRecipe,
      id: 'different-preset',
      presetId: 'different-preset',
    }, preset),
    false,
    'a mismatched active library recipe cannot be reset',
  )
})

test('resets only the active library recipe to its built-in preset', () => {
  const changedRecipe = {
    ...preset,
    id: 'local-browser-copy',
    presetId: preset.id,
    note: 'Preheat oven to 350 degrees',
    updatedAt: 1800000000000,
  }
  const otherRecipe = {
    id: 'other-recipe',
    title: 'Other Recipe',
    note: '',
    ingredients: '1 cup sugar',
    actions: [],
  }

  assert.deepEqual(
    resetRecipeInLibrary(
      [changedRecipe, otherRecipe],
      changedRecipe.id,
      preset,
    ),
    [
      {
        ...preset,
        id: changedRecipe.id,
        presetId: preset.id,
      },
      otherRecipe,
    ],
  )

  assert.deepEqual(
    resetRecipeInLibrary(
      [otherRecipe],
      otherRecipe.id,
      preset,
    ),
    [otherRecipe],
    'reset does not overwrite an active recipe from a different preset',
  )
})

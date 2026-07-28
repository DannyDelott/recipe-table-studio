import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BUILT_IN_RECIPE_VERSION,
  BUILT_IN_RECIPES,
  mergeBuiltInRecipes,
  seedBuiltInRecipes,
} from '../src/built-in-recipes.js'

test('ships the six recipes exported from production in shelf order', () => {
  assert.deepEqual(
    BUILT_IN_RECIPES.map((recipe) => recipe.title),
    [
      'Lemon Bars',
      'Cinnamon Apple Muffins',
      'Irish Soda Bread',
      'Carrot Cake',
      'Zucchini Bread',
      'Banana Bread',
    ],
  )
})

test('ships the latest Carrot Cake and Banana Bread preset updates', () => {
  assert.equal(BUILT_IN_RECIPE_VERSION, 2)

  const carrotCake = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === 'carrot-cake-restored',
  )
  assert.equal(carrotCake.id, 'carrot-cake-restored')
  assert.equal(carrotCake.ingredients.split('\n')[0], '2 cups flour (240g)')
  assert.deepEqual(
    carrotCake.actions.map(({ id, text, sourceIds }) => ({
      id,
      text,
      sourceIds,
    })),
    [
      {
        id: 'combine',
        text: 'Combine in a bowl',
        sourceIds: [],
      },
      {
        id: 'add',
        text: 'Combine in a bowl',
        sourceIds: [],
      },
      {
        id: 'action-ms43vg5n-uise',
        text: 'Combine',
        sourceIds: ['add', 'combine'],
      },
      {
        id: 'bake',
        text: 'Bake for 30 to 35 minutes in greased baking pan',
        sourceIds: ['action-ms43vg5n-uise'],
      },
    ],
  )

  const bananaBread = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785090741628-m8u3v',
  )
  assert.equal(bananaBread.id, '1785090741628-m8u3v')
  assert.match(bananaBread.ingredients, /2 cups flour \(240g\)/)
  assert.equal(bananaBread.actions[1].text, 'Combine in a bowl')
  assert.equal(bananaBread.actions[2].text, 'Combine in a bowl')
})

test('adds missing built-ins without overwriting saved recipes', () => {
  const customizedMuffins = {
    ...BUILT_IN_RECIPES.find((recipe) => recipe.id === 'cinnamon-apple-muffins'),
    note: 'My preferred oven temperature',
  }

  const merged = mergeBuiltInRecipes([customizedMuffins])

  assert.equal(merged.length, 6)
  assert.deepEqual(merged[0], customizedMuffins)
  assert.equal(
    merged.find((recipe) => recipe.id === customizedMuffins.id).note,
    'My preferred oven temperature',
  )
})

test('merging built-ins is idempotent', () => {
  const merged = mergeBuiltInRecipes([])

  assert.deepEqual(mergeBuiltInRecipes(merged), merged)
})

test('seeds once per built-in version so deleted recipes stay deleted', () => {
  assert.deepEqual(seedBuiltInRecipes([], null), {
    recipes: BUILT_IN_RECIPES,
    version: BUILT_IN_RECIPE_VERSION,
    changed: true,
  })
  assert.deepEqual(seedBuiltInRecipes([], BUILT_IN_RECIPE_VERSION), {
    recipes: [],
    version: BUILT_IN_RECIPE_VERSION,
    changed: false,
  })
})

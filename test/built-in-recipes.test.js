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

test('ships the latest built-in preset updates', () => {
  assert.equal(BUILT_IN_RECIPE_VERSION, 6)

  const irishSodaBread = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785114493740-4u962',
  )
  assert.equal(irishSodaBread.id, '1785114493740-4u962')
  assert.equal(
    irishSodaBread.ingredients.split('\n')[0],
    '2 1/4 cups flour (270g)',
  )
  assert.deepEqual(
    irishSodaBread.actions.map(({ id, text, groupName, sourceIds }) => ({
      id,
      text,
      groupName,
      sourceIds,
    })),
    [
      {
        id: 'action-ms2j0fam-uhho',
        text: 'Combine in a bowl',
        groupName: 'Dry ingredients',
        sourceIds: [],
      },
      {
        id: 'action-ms2j1bce-wune',
        text: 'Combine until mixed',
        groupName: 'Dough',
        sourceIds: ['action-ms2j0fam-uhho'],
      },
      {
        id: 'action-ms2j1t1k-kjqo',
        text: 'Bake 10 minutes at 375 in greased pan',
        groupName: 'partial bake',
        sourceIds: ['action-ms2j1bce-wune'],
      },
      {
        id: 'action-ms2j2k5u-7hmc',
        text: 'Bake 40 minutes at 350 degrees',
        groupName: 'Irish Soda Bread',
        sourceIds: ['action-ms2j1t1k-kjqo'],
      },
    ],
  )

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

  const zucchiniBread = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === 'carrot-cake-2026-07-26',
  )
  assert.equal(zucchiniBread.id, 'carrot-cake-2026-07-26')
  assert.equal(
    zucchiniBread.ingredients.split('\n')[0],
    '1.5 cups flour (180g)',
  )
  assert.deepEqual(
    zucchiniBread.actions.map(({ id, text, sourceIds }) => ({
      id,
      text,
      sourceIds,
    })),
    [
      {
        id: 'action-ms27x7vg-fi58',
        text: 'Combine in a bowl',
        sourceIds: [],
      },
      {
        id: 'action-ms27xpfu-qgdh',
        text: 'Combine in a bowl',
        sourceIds: [],
      },
      {
        id: 'action-ms2aq4sv-a3zw',
        text: 'Combine until mixed',
        sourceIds: [
          'action-ms27x7vg-fi58',
          'action-ms27xpfu-qgdh',
        ],
      },
      {
        id: 'action-ms27z5tl-uy1y',
        text: 'Stir in',
        sourceIds: ['action-ms2aq4sv-a3zw'],
      },
      {
        id: 'action-ms27zl2a-vlbe',
        text: 'Bake 55 minutes in greased pan',
        sourceIds: ['action-ms27z5tl-uy1y'],
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
  assert.equal(bananaBread.actions[3].text, 'Combine until mixed')
  assert.equal(bananaBread.actions[5].text, 'Bake 1 hour in greased loaf pan')
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

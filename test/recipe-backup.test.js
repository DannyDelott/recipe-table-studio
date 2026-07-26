import test from 'node:test'
import assert from 'node:assert/strict'
import { strFromU8, unzipSync } from 'fflate'

import {
  createRecipeArchive,
  createRecipeFile,
  mergeRecipeIntoLibrary,
  parseRecipeFile,
} from '../src/recipe-backup.js'

const bananaBread = {
  id: 'banana-bread',
  title: 'Banana Bread',
  note: 'Preheat oven to 325 degrees',
  ingredients: '1 cup sugar\n2 cups flour',
  actions: [{
    id: 'mix',
    text: 'Mix',
    groupName: 'Batter',
    ingredientLines: [1, 2],
    sourceIds: [],
  }],
  updatedAt: 1700000000000,
}

test('creates a readable, versioned single-recipe file', () => {
  const backup = JSON.parse(createRecipeFile(
    bananaBread,
    new Date('2026-07-26T12:00:00.000Z'),
  ))

  assert.equal(backup.format, 'recipe-table-studio-recipe')
  assert.equal(backup.version, 1)
  assert.equal(backup.exportedAt, '2026-07-26T12:00:00.000Z')
  assert.deepEqual(backup.recipe, bananaBread)
})

test('parses a recipe file created by the studio', () => {
  const recipe = parseRecipeFile(createRecipeFile(bananaBread))

  assert.deepEqual(recipe, bananaBread)
})

test('creates a ZIP with one valid, uniquely named file per recipe', () => {
  const secondBananaBread = { ...bananaBread, id: 'banana-bread-2' }
  const files = unzipSync(createRecipeArchive([bananaBread, secondBananaBread]))

  assert.deepEqual(Object.keys(files), [
    'banana-bread.recipe.json',
    'banana-bread-2.recipe.json',
  ])
  assert.deepEqual(
    parseRecipeFile(strFromU8(files['banana-bread.recipe.json'])),
    bananaBread,
  )
})

test('rejects malformed and unsupported recipe files', () => {
  assert.throws(() => parseRecipeFile('{'), /valid JSON/i)
  assert.throws(
    () => parseRecipeFile(JSON.stringify({
      format: 'recipe-table-studio-recipe',
      version: 2,
      recipe: bananaBread,
    })),
    /version/i,
  )
})

test('rejects invalid recipes and collection backups', () => {
  assert.throws(
    () => parseRecipeFile(JSON.stringify({
      format: 'recipe-table-studio-recipe',
      version: 1,
      recipe: { ...bananaBread, ingredients: [] },
    })),
    /ingredients/i,
  )

  assert.throws(
    () => parseRecipeFile(JSON.stringify({
      format: 'recipe-table-studio',
      version: 1,
      recipes: [bananaBread, bananaBread],
    })),
    /recipe table studio recipe/i,
  )
})

test('merges imported recipes without removing existing recipes', () => {
  const carrotCake = { ...bananaBread, id: 'carrot-cake', title: 'Carrot Cake' }
  const updatedBananaBread = { ...bananaBread, note: 'Updated note' }
  const result = mergeRecipeIntoLibrary(
    [bananaBread, carrotCake],
    updatedBananaBread,
  )

  assert.equal(result.addedCount, 0)
  assert.equal(result.updatedCount, 1)
  assert.deepEqual(result.recipes, [updatedBananaBread, carrotCake])
})

test('puts newly imported recipes first and reports how many were added', () => {
  const carrotCake = { ...bananaBread, id: 'carrot-cake', title: 'Carrot Cake' }
  const result = mergeRecipeIntoLibrary([bananaBread], carrotCake)

  assert.equal(result.addedCount, 1)
  assert.equal(result.updatedCount, 0)
  assert.deepEqual(result.recipes, [carrotCake, bananaBread])
})

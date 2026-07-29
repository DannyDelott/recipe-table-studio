import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BUILT_IN_RECIPE_VERSION,
  BUILT_IN_RECIPES,
  mergeBuiltInRecipes,
  seedBuiltInRecipes,
} from '../src/built-in-recipes.js'

test('ships the eight recipes exported from production in shelf order', () => {
  assert.deepEqual(
    BUILT_IN_RECIPES.map((recipe) => recipe.title),
    [
      'Blueberry Muffins',
      'Streusel Topping',
      'Lemon Bar',
      'Cinnamon Apple Muffins',
      'Irish Soda Bread',
      'Carrot Cake',
      'Zucchini Bread',
      'Banana Bread',
    ],
  )
})

test('ships the latest built-in preset updates', () => {
  assert.equal(BUILT_IN_RECIPE_VERSION, 8)

  const blueberryMuffins = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785355185413-9488a',
  )
  assert.equal(blueberryMuffins.title, 'Blueberry Muffins')
  assert.equal(blueberryMuffins.note, 'Preheat oven 400 degrees')
  assert.equal(
    blueberryMuffins.ingredients,
    [
      '2 cups flour',
      '1 cup granulated sugar',
      '2 teaspoons baking powder',
      '1/2 teaspoon salt',
      '2 eggs',
      '1/2 cup melted butter',
      '1/2 cup milk',
      '1 teaspoon vanilla extract',
      '2 cups blueberries',
      '1 tablespoon lemon zest',
    ].join('\n'),
  )
  assert.deepEqual(blueberryMuffins.actions, [
    {
      id: 'action-ms6ib27p-mnqe',
      text: 'Mix together in large bowl',
      groupName: 'Dry mixture',
      ingredientLines: [1, 2, 3, 4],
      sourceIds: [],
    },
    {
      id: 'action-ms6ibqdk-cpx7',
      text: 'Whisk together until smooth',
      groupName: 'Wet mixture',
      ingredientLines: [5, 6, 7, 8],
      sourceIds: [],
    },
    {
      id: 'action-ms6ibzva-kmx1',
      text: 'Fold together until just combined. Don’t overmix.',
      groupName: 'Batter',
      ingredientLines: [9, 10],
      sourceIds: [
        'action-ms6ib27p-mnqe',
        'action-ms6ibqdk-cpx7',
      ],
    },
    {
      id: 'action-ms6icazn-kkji',
      text: 'Fill lined muffin tins about 3/4 full. Top with 1 tablespoon of streusel topping.',
      groupName: 'Filled muffin tins',
      ingredientLines: [],
      sourceIds: ['action-ms6ibzva-kmx1'],
    },
    {
      id: 'action-ms6icpaa-klmb',
      text: 'Bake 18-22 minutes, until tops are golden and toothpick comes out clean. Rotate tins halfway through baking.',
      groupName: 'Blueberry Muffins',
      ingredientLines: [],
      sourceIds: ['action-ms6icazn-kkji'],
    },
  ])

  const streuselTopping = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785355027811-4liog',
  )
  assert.equal(streuselTopping.title, 'Streusel Topping')
  assert.equal(streuselTopping.note, '')
  assert.equal(
    streuselTopping.ingredients,
    [
      '1/4 cup flour',
      '2 tablespoon sugar',
      '2 tablespoon brown sugar',
      '1/4 teaspoon cinnamon',
      '1/8 teaspoon salt',
      '2 tablespoon cold butter',
    ].join('\n'),
  )
  assert.deepEqual(streuselTopping.actions, [
    {
      id: 'action-ms6i9aaa-sd2n',
      text: 'Combine in medium bowl',
      groupName: 'Streusel mixture',
      ingredientLines: [1, 2, 3, 4, 5],
      sourceIds: [],
    },
    {
      id: 'action-ms6i9ldg-yxry',
      text: 'Cut in until crumbly and coarse',
      groupName: 'Streusel Topping',
      ingredientLines: [6],
      sourceIds: ['action-ms6i9aaa-sd2n'],
    },
  ])

  const lemonBar = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785115943512-w4h3p',
  )
  assert.equal(lemonBar.title, 'Lemon Bar')
  assert.equal(lemonBar.note, 'Preheat oven 350 degrees')
  assert.equal(
    lemonBar.ingredients,
    [
      '2 cups flour',
      '1 cup butter',
      '1/2 cup powdered sugar',
      '4 eggs',
      '7 tbsp lemon juice',
      '2 cups sugar',
      '1/2 tsp salt',
      '4 tbsp flour',
    ].join('\n'),
  )
  assert.deepEqual(lemonBar.actions, [
    {
      id: 'action-ms2jv24k-cwg1',
      text: 'Cream and press into ungreased pan',
      groupName: 'Crust',
      ingredientLines: [1, 2, 3],
      sourceIds: [],
    },
    {
      id: 'action-ms2jvrke-59la',
      text: 'Bake 20 minutes',
      groupName: 'Baked crust',
      ingredientLines: [],
      sourceIds: ['action-ms2jv24k-cwg1'],
    },
    {
      id: 'action-ms2jwjlj-cpnv',
      text: 'Beat',
      groupName: 'Beaten eggs',
      ingredientLines: [4],
      sourceIds: [],
    },
    {
      id: 'action-ms2jwsh3-3236',
      text: 'Combine',
      groupName: 'Lemon filling',
      ingredientLines: [5, 6, 7, 8],
      sourceIds: ['action-ms2jwjlj-cpnv'],
    },
    {
      id: 'action-ms2jx4n2-7070',
      text: 'Pour on baked crust',
      groupName: 'Filled crust',
      ingredientLines: [],
      sourceIds: [
        'action-ms2jvrke-59la',
        'action-ms2jwsh3-3236',
      ],
    },
    {
      id: 'action-ms2jxee1-b0lo',
      text: 'Bake 25 minutes',
      groupName: 'Baked lemon bars',
      ingredientLines: [],
      sourceIds: ['action-ms2jx4n2-7070'],
    },
    {
      id: 'action-ms2jxn84-q1bc',
      text: 'Sprinkle with powdered sugar while warm',
      groupName: 'Lemon Bars',
      ingredientLines: [],
      sourceIds: ['action-ms2jxee1-b0lo'],
    },
  ])

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

  assert.equal(merged.length, 8)
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

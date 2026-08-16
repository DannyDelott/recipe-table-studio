import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BUILT_IN_RECIPE_VERSION,
  BUILT_IN_RECIPES,
  mergeBuiltInRecipes,
  seedBuiltInRecipes,
} from '../src/built-in-recipes.js'

test('ships the eleven recipes exported from production in shelf order', () => {
  assert.deepEqual(
    BUILT_IN_RECIPES.map((recipe) => recipe.title),
    [
      'Sushi Rice',
      'Pumpkin Muffins',
      'Gingerbread Muffins',
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
  assert.equal(BUILT_IN_RECIPE_VERSION, 23)

  const sushiRice = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785770600523-rx2nw',
  )
  assert.equal(sushiRice.title, 'Sushi Rice')
  assert.equal(sushiRice.note, '')
  assert.equal(
    sushiRice.ingredients,
    [
      '4 cups rice',
      '5 1/3 tbsp rice vinegar',
      '4 tbsp sugar',
      '1 1/3 tsp salt',
    ].join('\n'),
  )
  assert.deepEqual(sushiRice.actions, [
    {
      id: 'action-msddm7mt-hrw4',
      text: 'Rinse and cook on Sushi setting',
      groupName: 'Rinsed rice',
      ingredientLines: [1],
      sourceIds: [],
    },
    {
      id: 'action-msddnfua-3obw',
      text: 'Stir until sugar dissolves',
      groupName: 'Sushi seasoning',
      ingredientLines: [2, 3, 4],
      sourceIds: [],
    },
    {
      id: 'action-msddow3i-u12l',
      text: 'Combine until cool and glossy',
      groupName: 'Sushi Rice',
      ingredientLines: [],
      sourceIds: [
        'action-msddm7mt-hrw4',
        'action-msddnfua-3obw',
      ],
    },
  ])

  const pumpkinMuffins = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785425059211-8ggsy',
  )
  assert.equal(pumpkinMuffins.title, 'Pumpkin Muffins')
  assert.equal(pumpkinMuffins.note, 'Preheat oven 425 degrees')
  assert.equal(
    pumpkinMuffins.ingredients,
    [
      '1 3/4 cups flour (219g)',
      '1 tsp baking soda',
      '1 1/2 tsp ground cinnamon',
      '1 1/2 tsp pumpkin pie spice',
      '1/4 tsp ground ginger',
      '1/2 tsp kosher salt',
      '1/2 cup vegetable oil',
      '1/2 cup sugar',
      '1/2 cup brown sugar',
      '1 1/2 cup pumpkin puree',
      '2 eggs',
      '1/4 cup milk',
    ].join('\n'),
  )
  assert.deepEqual(pumpkinMuffins.actions, [
    {
      id: 'action-ms7nq0xa-44j8',
      text: 'Combine in a bowl',
      groupName: 'Dry mixture',
      ingredientLines: [1, 2, 3, 4, 5, 6],
      sourceIds: [],
    },
    {
      id: 'action-ms7nqibn-4m04',
      text: 'Combine in a bowl',
      groupName: 'Wet mixture',
      ingredientLines: [7, 8, 9, 10, 11, 12],
      sourceIds: [],
    },
    {
      id: 'action-ms7nrcub-ipfg',
      text: 'Combine until mixed',
      groupName: 'Batter',
      ingredientLines: [],
      sourceIds: [
        'action-ms7nq0xa-44j8',
        'action-ms7nqibn-4m04',
      ],
    },
    {
      id: 'action-ms7nrq1w-vsp5',
      text: 'Bake 5 minutes at 425 degrees',
      groupName: 'Partially baked muffins',
      ingredientLines: [],
      sourceIds: ['action-ms7nrcub-ipfg'],
    },
    {
      id: 'action-ms7nrymp-kko9',
      text: 'Bake 16-17 minutes at 350 degrees ',
      groupName: 'Pumpkin Muffins',
      ingredientLines: [],
      sourceIds: ['action-ms7nrq1w-vsp5'],
    },
  ])

  const gingerbreadMuffins = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785369418583-e8ewd',
  )
  assert.equal(gingerbreadMuffins.title, 'Gingerbread Muffins')
  assert.equal(gingerbreadMuffins.note, 'Preheat oven 350 degrees')
  assert.equal(
    gingerbreadMuffins.ingredients,
    [
      '2 1/2 cups flour (300g)',
      '1 tbsp ground ginger',
      '2 tsp ground cinnamon',
      '1 tsp baking powder',
      '1/4 tsp baking soda',
      '1/2 tsp salt',
      '1/4 cup oil',
      '2/3 cup packed dark brown sugar',
      '1/2 cup molasses',
      '1 large egg',
      '1 1/3 cups buttermilk',
    ].join('\n'),
  )
  assert.deepEqual(gingerbreadMuffins.actions, [
    {
      id: 'action-ms6qae9s-l0up',
      text: 'Combine in a medium bowl',
      groupName: 'Dry mixture',
      ingredientLines: [1, 2, 3, 4, 5, 6],
      sourceIds: [],
    },
    {
      id: 'action-ms6qaxcd-r0te',
      text: 'Combine in a bowl',
      groupName: 'Oil and sugar mixture',
      ingredientLines: [7, 8],
      sourceIds: [],
    },
    {
      id: 'action-ms6qb40d-z5hn',
      text: 'Combine',
      groupName: 'Molasses mixture',
      ingredientLines: [9],
      sourceIds: ['action-ms6qaxcd-r0te'],
    },
    {
      id: 'action-ms6qbg2z-mzx3',
      text: 'Combine',
      groupName: 'Egg mixture',
      ingredientLines: [10],
      sourceIds: ['action-ms6qb40d-z5hn'],
    },
    {
      id: 'action-ms6qbgsy-622y',
      text: 'Combine',
      groupName: 'Wet mixture',
      ingredientLines: [11],
      sourceIds: ['action-ms6qbg2z-mzx3'],
    },
    {
      id: 'action-ms6qbhid-zc8k',
      text: 'Combine until mixed',
      groupName: 'Batter',
      ingredientLines: [],
      sourceIds: [
        'action-ms6qae9s-l0up',
        'action-ms6qbgsy-622y',
      ],
    },
    {
      id: 'action-ms6qbttx-37u0',
      text: 'Bake 20-25 minutes',
      groupName: 'Gingerbread Muffins',
      ingredientLines: [],
      sourceIds: ['action-ms6qbhid-zc8k'],
    },
  ])

  const blueberryMuffins = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === '1785355185413-9488a',
  )
  assert.equal(blueberryMuffins.title, 'Blueberry Muffins')
  assert.equal(blueberryMuffins.note, 'Preheat oven 400 degrees')
  assert.equal(
    blueberryMuffins.ingredients,
    [
      '1 cup granulated sugar',
      '1 tbsp lemon zest',
      '2 cups flour (240g)',
      '2 tsp baking powder',
      '1/2 tsp salt',
      '2 eggs',
      '1/2 cup melted butter',
      '1/2 cup milk',
      '1 tsp vanilla extract',
      '2 cups blueberries',
    ].join('\n'),
  )
  assert.deepEqual(blueberryMuffins.actions, [
    {
      id: 'action-ms6iksru-bdrh',
      text: 'Combine',
      groupName: 'Lemon sugar',
      ingredientLines: [1, 2],
      sourceIds: [],
    },
    {
      id: 'action-ms6ib27p-mnqe',
      text: 'Combine in large bowl',
      groupName: 'Dry mixture',
      ingredientLines: [1, 5],
      sourceIds: ['action-ms6iksru-bdrh'],
    },
    {
      id: 'action-ms6ibqdk-cpx7',
      text: 'Combine in a bowl',
      groupName: 'Wet mixture',
      ingredientLines: [6, 7, 8, 9],
      sourceIds: [],
    },
    {
      id: 'action-ms6ibzva-kmx1',
      text: 'Combine until mixed',
      groupName: 'Batter',
      ingredientLines: [],
      sourceIds: [
        'action-ms6ib27p-mnqe',
        'action-ms6ibqdk-cpx7',
      ],
    },
    {
      id: 'action-ms6ispyz-thqn',
      text: 'Stir in',
      groupName: 'Final batter',
      ingredientLines: [10],
      sourceIds: ['action-ms6ibzva-kmx1'],
    },
    {
      id: 'action-ms6icpaa-klmb',
      text: 'Bake 25 minutes',
      groupName: 'Blueberry Muffins',
      ingredientLines: [],
      sourceIds: ['action-ms6ispyz-thqn'],
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
      '1/4 cup flour (30g)',
      '2 tbsp sugar',
      '2 tbsp brown sugar',
      '1/4 tsp cinnamon',
      '1/8 tsp salt',
      '2 tbsp cold butter',
    ].join('\n'),
  )
  assert.deepEqual(streuselTopping.actions, [
    {
      id: 'action-ms6i9aaa-sd2n',
      text: 'Combine in a bowl',
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
      '2 cups flour (240g)',
      '1 cup butter',
      '1/2 cup powdered sugar',
      '4 eggs',
      '7 tbsp lemon juice',
      '2 cups sugar',
      '1/2 tsp salt',
      '4 tbsp flour (30g)',
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

  const cinnamonAppleMuffins = BUILT_IN_RECIPES.find(
    (recipe) => recipe.id === 'cinnamon-apple-muffins',
  )
  assert.equal(cinnamonAppleMuffins.title, 'Cinnamon Apple Muffins')
  assert.equal(cinnamonAppleMuffins.note, 'Preheat oven 375 degrees')
  assert.equal(
    cinnamonAppleMuffins.ingredients,
    [
      '2 cups diced apples',
      '2 tsp flour (5g)',
      '1/2 tsp ground cinnamon',
      '2 cups flour (240g)',
      '1 1/2 tsp baking powder',
      '1/2 tsp kosher salt',
      '2 tsp ground cinnamon',
      '1/2 cup butter (room temp)',
      '1 cup sugar',
      '2 eggs',
      '2 tsp vanilla extract',
      '1/2 cup milk',
    ].join('\n'),
  )
  assert.deepEqual(cinnamonAppleMuffins.actions, [
    {
      id: 'apple-mixture',
      text: 'Combine in a bowl',
      groupName: 'Apple mixture',
      ingredientLines: [1, 2, 3],
      sourceIds: [],
    },
    {
      id: 'dry-mixture',
      text: 'Combine in a bowl',
      groupName: 'Dry mixture',
      ingredientLines: [4, 5, 6, 7],
      sourceIds: [],
    },
    {
      id: 'creamed-butter',
      text: 'Cream together',
      groupName: 'Creamed butter and sugar',
      ingredientLines: [8, 9],
      sourceIds: [],
    },
    {
      id: 'egg-mixture',
      text: 'Add one at a time, mix fully',
      groupName: 'Egg mixture',
      ingredientLines: [10],
      sourceIds: ['creamed-butter'],
    },
    {
      id: 'wet-mixture',
      text: 'Stir in',
      groupName: 'Wet mixture',
      ingredientLines: [11],
      sourceIds: ['egg-mixture'],
    },
    {
      id: 'batter',
      text: 'Combine until mixed',
      groupName: 'Batter',
      ingredientLines: [12],
      sourceIds: ['dry-mixture', 'wet-mixture'],
    },
    {
      id: 'batter-apples',
      text: 'Stir in',
      groupName: 'Batter with apples',
      ingredientLines: [],
      sourceIds: ['apple-mixture', 'batter'],
    },
    {
      id: 'baked-muffins',
      text: 'Bake 20-30 minutes',
      groupName: 'Cinnamon Apple Muffins',
      ingredientLines: [],
      sourceIds: ['batter-apples'],
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
  assert.equal(carrotCake.title, 'Carrot Cake')
  assert.equal(carrotCake.note, 'Preheat Oven 350 degrees')
  assert.equal(
    carrotCake.ingredients,
    [
      '2 cups flour (240g)',
      '2 cups sugar',
      '1 tsp baking powder',
      '1 tsp baking soda',
      '1 tsp ground cinnamon',
      '3 cups finely shredded carrot',
      '1 cup cooking oil',
      '4 eggs',
    ].join('\n'),
  )
  assert.deepEqual(carrotCake.actions, [
    {
      id: 'combine',
      text: 'Combine in a bowl',
      groupName: 'Dry ingredients',
      ingredientLines: [1, 2, 3, 4, 5],
      sourceIds: [],
    },
    {
      id: 'add',
      text: 'Combine in a bowl',
      groupName: 'Wet mixture',
      ingredientLines: [6, 7, 8],
      sourceIds: [],
    },
    {
      id: 'action-ms43vg5n-uise',
      text: 'Combine',
      groupName: 'batter',
      ingredientLines: [],
      sourceIds: ['add', 'combine'],
    },
    {
      id: 'bake',
      text: 'Bake for 30 to 35 minutes in greased baking pan',
      groupName: 'Carrot cake',
      ingredientLines: [],
      sourceIds: ['action-ms43vg5n-uise'],
    },
  ])

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

  assert.equal(merged.length, 11)
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

test('retires Sheet Pan Chicken Shawarma from previously seeded libraries', () => {
  const retiredRecipe = {
    id: '1786069198591-0h5lb',
    title: 'Sheet Pan Chicken Shawarma',
  }

  const result = seedBuiltInRecipes([retiredRecipe], 22)

  assert.equal(result.version, 23)
  assert.equal(result.changed, true)
  assert.equal(result.recipes.length, 11)
  assert.equal(
    result.recipes.some((recipe) => recipe.id === retiredRecipe.id),
    false,
  )
  assert.deepEqual(result.recipes, BUILT_IN_RECIPES)
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

import bananaBreadFile from '../recipes/banana-bread.recipe.json' with { type: 'json' }
import blueberryMuffinsFile from '../recipes/blueberry-muffins.recipe.json' with { type: 'json' }
import carrotCakeFile from '../recipes/carrot-cake.recipe.json' with { type: 'json' }
import cinnamonAppleMuffinsFile from '../recipes/cinnamon-apple-muffins.recipe.json' with { type: 'json' }
import gingerbreadMuffinsFile from '../recipes/gingerbread-muffins.recipe.json' with { type: 'json' }
import irishSodaBreadFile from '../recipes/irish-soda-bread.recipe.json' with { type: 'json' }
import lemonBarsFile from '../recipes/lemon-bars.recipe.json' with { type: 'json' }
import oneBowlMuffinsByJamieFile from '../recipes/one-bowl-muffins-by-jamie.recipe.json' with { type: 'json' }
import pumpkinMuffinsFile from '../recipes/pumpkin-muffins.recipe.json' with { type: 'json' }
import streuselToppingFile from '../recipes/streusel-topping.recipe.json' with { type: 'json' }
import sushiRiceFile from '../recipes/sushi-rice.recipe.json' with { type: 'json' }
import zucchiniBreadFile from '../recipes/zucchini-bread.recipe.json' with { type: 'json' }

import { parseRecipeFile } from './recipe-backup.js'

const productionRecipeFiles = [
  oneBowlMuffinsByJamieFile,
  sushiRiceFile,
  pumpkinMuffinsFile,
  gingerbreadMuffinsFile,
  blueberryMuffinsFile,
  streuselToppingFile,
  lemonBarsFile,
  cinnamonAppleMuffinsFile,
  irishSodaBreadFile,
  carrotCakeFile,
  zucchiniBreadFile,
  bananaBreadFile,
]

const retiredBuiltInRecipeIds = new Set([
  '1786069198591-0h5lb',
])

export const BUILT_IN_RECIPE_VERSION = 24
export const BUILT_IN_RECIPES = productionRecipeFiles.map((recipeFile) =>
  parseRecipeFile(JSON.stringify(recipeFile)))

export function mergeBuiltInRecipes(savedRecipes) {
  const existingIds = new Set(savedRecipes.map((recipe) => recipe.id))
  return [
    ...savedRecipes,
    ...BUILT_IN_RECIPES.filter((recipe) => !existingIds.has(recipe.id)),
  ]
}

export function seedBuiltInRecipes(savedRecipes, seededVersion) {
  if (Number(seededVersion) >= BUILT_IN_RECIPE_VERSION) {
    return {
      recipes: savedRecipes,
      version: BUILT_IN_RECIPE_VERSION,
      changed: false,
    }
  }

  const activeSavedRecipes = savedRecipes.filter(
    (recipe) => !retiredBuiltInRecipeIds.has(recipe.id),
  )

  return {
    recipes: mergeBuiltInRecipes(activeSavedRecipes),
    version: BUILT_IN_RECIPE_VERSION,
    changed: true,
  }
}

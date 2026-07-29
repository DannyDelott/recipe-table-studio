import bananaBreadFile from '../recipes/banana-bread.recipe.json' with { type: 'json' }
import carrotCakeFile from '../recipes/carrot-cake.recipe.json' with { type: 'json' }
import cinnamonAppleMuffinsFile from '../recipes/cinnamon-apple-muffins.recipe.json' with { type: 'json' }
import irishSodaBreadFile from '../recipes/irish-soda-bread.recipe.json' with { type: 'json' }
import lemonBarsFile from '../recipes/lemon-bars.recipe.json' with { type: 'json' }
import zucchiniBreadFile from '../recipes/zucchini-bread.recipe.json' with { type: 'json' }

import { parseRecipeFile } from './recipe-backup.js'

const productionRecipeFiles = [
  lemonBarsFile,
  cinnamonAppleMuffinsFile,
  irishSodaBreadFile,
  carrotCakeFile,
  zucchiniBreadFile,
  bananaBreadFile,
]

export const BUILT_IN_RECIPE_VERSION = 6
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

  return {
    recipes: mergeBuiltInRecipes(savedRecipes),
    version: BUILT_IN_RECIPE_VERSION,
    changed: true,
  }
}

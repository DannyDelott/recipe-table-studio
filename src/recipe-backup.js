import { strToU8, zipSync } from 'fflate'

export const RECIPE_FILE_FORMAT = 'recipe-table-studio-recipe'
export const RECIPE_FILE_VERSION = 1

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireString(value, label, { allowEmpty = true } = {}) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    throw new Error(`${label} must be ${allowEmpty ? 'text' : 'non-empty text'}.`)
  }
  return value
}

function normalizeAction(action, recipeIndex, actionIndex, previousActionIds) {
  const label = `Recipe ${recipeIndex + 1}, action ${actionIndex + 1}`
  if (!isRecord(action)) throw new Error(`${label} must be an object.`)

  const id = requireString(action.id, `${label} ID`, { allowEmpty: false })
  const text = requireString(action.text, `${label} text`)
  const groupName = requireString(action.groupName, `${label} result group`)

  if (!Array.isArray(action.ingredientLines)
    || action.ingredientLines.some((line) => !Number.isInteger(line) || line < 1)) {
    throw new Error(`${label} ingredient lines must be positive whole numbers.`)
  }

  if (!Array.isArray(action.sourceIds)
    || action.sourceIds.some((sourceId) => typeof sourceId !== 'string')) {
    throw new Error(`${label} source groups must be action IDs.`)
  }

  const unavailableSource = action.sourceIds.find((sourceId) => !previousActionIds.has(sourceId))
  if (unavailableSource) {
    throw new Error(`${label} references a result group that does not appear earlier in the recipe.`)
  }

  return {
    id,
    text,
    groupName,
    ingredientLines: [...action.ingredientLines],
    sourceIds: [...action.sourceIds],
  }
}

function normalizeBackupRecipe(recipe, recipeIndex) {
  const label = `Recipe ${recipeIndex + 1}`
  if (!isRecord(recipe)) throw new Error(`${label} must be an object.`)

  const id = requireString(recipe.id, `${label} ID`, { allowEmpty: false })
  const title = requireString(recipe.title, `${label} title`, { allowEmpty: false })
  const note = requireString(recipe.note ?? '', `${label} note`)
  const ingredients = requireString(recipe.ingredients, `${label} ingredients`)
  if (!Array.isArray(recipe.actions)) throw new Error(`${label} actions must be a list.`)

  const actionIds = new Set()
  const actions = recipe.actions.map((action, actionIndex) => {
    const normalized = normalizeAction(action, recipeIndex, actionIndex, actionIds)
    if (actionIds.has(normalized.id)) throw new Error(`${label} has a duplicate action ID.`)
    actionIds.add(normalized.id)
    return normalized
  })

  const normalized = { id, title, note, ingredients, actions }
  if (recipe.updatedAt !== undefined) {
    if (!Number.isFinite(recipe.updatedAt)) throw new Error(`${label} update time must be a number.`)
    normalized.updatedAt = recipe.updatedAt
  }
  return normalized
}

function normalizeRecipeList(recipes) {
  if (!Array.isArray(recipes)) throw new Error('The backup recipes field must be a list.')

  const recipeIds = new Set()
  return recipes.map((recipe, recipeIndex) => {
    const normalized = normalizeBackupRecipe(recipe, recipeIndex)
    if (recipeIds.has(normalized.id)) throw new Error('The backup contains a duplicate recipe ID.')
    recipeIds.add(normalized.id)
    return normalized
  })
}

export function createRecipeFile(recipe, exportedAt = new Date()) {
  const timestamp = exportedAt instanceof Date ? exportedAt : new Date(exportedAt)
  if (Number.isNaN(timestamp.getTime())) throw new Error('The export time is invalid.')

  return `${JSON.stringify({
    format: RECIPE_FILE_FORMAT,
    version: RECIPE_FILE_VERSION,
    exportedAt: timestamp.toISOString(),
    recipe: normalizeBackupRecipe(recipe, 0),
  }, null, 2)}\n`
}

export function recipeFileStem(title) {
  const stem = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
  return stem || 'recipe'
}

export function createRecipeArchive(recipes, exportedAt = new Date()) {
  const normalizedRecipes = normalizeRecipeList(recipes)
  const usedNames = new Map()
  const files = Object.fromEntries(normalizedRecipes.map((recipe) => {
    const stem = recipeFileStem(recipe.title)
    const sequence = (usedNames.get(stem) || 0) + 1
    usedNames.set(stem, sequence)
    const suffix = sequence === 1 ? '' : `-${sequence}`
    return [
      `${stem}${suffix}.recipe.json`,
      strToU8(createRecipeFile(recipe, exportedAt)),
    ]
  }))
  return zipSync(files, { level: 6 })
}

export function parseRecipeFile(contents) {
  let recipeFile
  try {
    recipeFile = JSON.parse(contents)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!isRecord(recipeFile) || recipeFile.format !== RECIPE_FILE_FORMAT) {
    throw new Error('This is not a Recipe Table Studio recipe file.')
  }
  if (recipeFile.version !== RECIPE_FILE_VERSION) {
    throw new Error(`Recipe file version ${String(recipeFile.version)} is not supported.`)
  }

  return normalizeBackupRecipe(recipeFile.recipe, 0)
}

export function mergeRecipeIntoLibrary(existingRecipes, importedRecipe) {
  const existing = normalizeRecipeList(existingRecipes)
  const imported = normalizeBackupRecipe(importedRecipe, 0)
  const updatedCount = existing.some((recipe) => recipe.id === imported.id) ? 1 : 0

  return {
    recipes: [
      imported,
      ...existing.filter((recipe) => recipe.id !== imported.id),
    ],
    addedCount: updatedCount ? 0 : 1,
    updatedCount,
  }
}

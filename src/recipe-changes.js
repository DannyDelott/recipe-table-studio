export function editableRecipeContent(recipe = {}) {
  return {
    title: String(recipe.title || ''),
    note: String(recipe.note || ''),
    ingredients: String(recipe.ingredients || ''),
    actions: Array.isArray(recipe.actions)
      ? recipe.actions.map((action) => ({
        id: String(action.id || ''),
        text: String(action.text || ''),
        groupName: String(action.groupName || ''),
        ingredientLines: [...(action.ingredientLines || [])].map(Number),
        sourceIds: [...(action.sourceIds || [])].map(String),
      }))
      : [],
  }
}

export function recipeHasChanges(recipe, preset) {
  return JSON.stringify(editableRecipeContent(recipe))
    !== JSON.stringify(editableRecipeContent(preset))
}

export function recipeMatchesPresetIdentity(recipe, preset) {
  if (!recipe || !preset) return false
  if (Object.prototype.hasOwnProperty.call(recipe, 'presetId')) {
    return recipe.presetId === preset.id
  }
  if (recipe.id === preset.id) return true

  return String(recipe.title || '').trim().toLocaleLowerCase()
    === String(preset.title || '').trim().toLocaleLowerCase()
}

export function recipeHasResettableChanges(currentRecipe, savedRecipe, preset) {
  return Boolean(
    preset
    && savedRecipe
    && recipeMatchesPresetIdentity(savedRecipe, preset)
    && (
      recipeHasChanges(currentRecipe, preset)
      || recipeHasChanges(savedRecipe, preset)
    ),
  )
}

export function resetRecipeInLibrary(recipes, activeRecipeId, preset) {
  if (!activeRecipeId || !preset) return recipes

  return recipes.map((recipe) => (
    recipe.id === activeRecipeId && recipeMatchesPresetIdentity(recipe, preset)
      ? {
          ...preset,
          id: activeRecipeId,
          presetId: preset.id,
          actions: editableRecipeContent(preset).actions,
        }
      : recipe
  ))
}

export function findBuiltInPresetForLoadedRecipe(
  recipe,
  builtInRecipes,
  preferredPresetId = null,
  allowTitleFallback = true,
) {
  const presetIds = [
    preferredPresetId,
    recipe?.presetId,
    recipe?.id,
  ].filter(Boolean)

  for (const presetId of presetIds) {
    const exactMatch = builtInRecipes.find((preset) => preset.id === presetId)
    if (exactMatch) return exactMatch
  }

  if (!allowTitleFallback) return null

  const normalizedTitle = String(recipe?.title || '').trim().toLocaleLowerCase()
  if (!normalizedTitle) return null

  return builtInRecipes.find((preset) =>
    String(preset.title || '').trim().toLocaleLowerCase() === normalizedTitle) || null
}

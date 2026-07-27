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

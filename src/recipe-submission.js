import { createRecipeFile } from './recipe-backup.js'

const REPOSITORY_ISSUES_URL = 'https://github.com/DannyDelott/recipe-table-studio/issues/new'

export function createRecipeSubmissionIssueUrl(recipe) {
  const recipeJson = createRecipeFile(recipe)
  const body = `## Recipe preset submission

Please add this recipe to the built-in preset library that ships with Recipe Table Studio.

### Inclusion checklist

- [ ] Validate the ingredients and action/group references.
- [ ] Add the recipe file under \`recipes/\`.
- [ ] Register it in \`src/built-in-recipes.js\` and bump the built-in library version.
- [ ] Update tests and verify the generated table.

### Recipe JSON

\`\`\`json
${recipeJson}
\`\`\`

<!-- Submitted from Recipe Table Studio -->`
  const issueUrl = new URL(REPOSITORY_ISSUES_URL)
  issueUrl.searchParams.set('title', `[Recipe Preset] ${recipe.title}`)
  issueUrl.searchParams.set('body', body)
  return issueUrl.toString()
}

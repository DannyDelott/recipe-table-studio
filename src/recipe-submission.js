import { createRecipeFile } from './recipe-backup.js'

const REPOSITORY_ISSUES_URL = 'https://github.com/DannyDelott/recipe-table-studio/issues/new'

export function createRecipeSubmissionIssueUrl(recipe, existingPreset = null) {
  const recipeJson = createRecipeFile(recipe)
  const isUpdate = Boolean(existingPreset)
  const body = `## Recipe preset change

### Change type

${isUpdate ? 'Update an existing preset' : 'Add a new preset'}

### Existing preset

- Existing preset ID: ${isUpdate ? `\`${existingPreset.id}\`` : 'None'}
- Existing preset title: ${isUpdate ? existingPreset.title : 'None'}

### Requested recipe JSON

\`\`\`json
${recipeJson}
\`\`\`

<!-- Submitted from Recipe Table Studio -->`
  const issueUrl = new URL(REPOSITORY_ISSUES_URL)
  issueUrl.searchParams.set(
    'title',
    `[Recipe Preset: ${isUpdate ? 'Update' : 'New'}] ${recipe.title}`,
  )
  issueUrl.searchParams.set('body', body)
  return issueUrl.toString()
}

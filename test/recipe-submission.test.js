import assert from 'node:assert/strict'
import test from 'node:test'

import { createRecipeSubmissionIssueUrl } from '../src/recipe-submission.js'

const recipe = {
  id: 'recipe-123',
  title: 'Tacos & Tea',
  note: 'Warm the tortillas',
  ingredients: '2 tortillas\n1 cup tea',
  actions: [{
    id: 'assemble',
    text: 'Assemble',
    groupName: 'Tacos',
    ingredientLines: [1],
    sourceIds: [],
  }],
  updatedAt: 1700000000000,
}

test('creates a prefilled GitHub issue for a recipe preset submission', () => {
  const issueUrl = new URL(createRecipeSubmissionIssueUrl(recipe))

  assert.equal(issueUrl.origin, 'https://github.com')
  assert.equal(issueUrl.pathname, '/DannyDelott/recipe-table-studio/issues/new')
  assert.equal(issueUrl.searchParams.get('title'), '[Recipe Preset] Tacos & Tea')

  const body = issueUrl.searchParams.get('body')
  assert.match(body, /## Recipe preset submission/)
  assert.match(body, /Add the recipe file under `recipes\/`/)
  assert.match(body, /Register it in `src\/built-in-recipes\.js`/)
  assert.match(body, /```json/)
  assert.match(body, /"title": "Tacos & Tea"/)
  assert.match(body, /"ingredientLines": \[/)
  assert.match(body, /Submitted from Recipe Table Studio/)
})

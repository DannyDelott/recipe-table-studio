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
  assert.equal(issueUrl.searchParams.get('title'), '[Recipe Preset: New] Tacos & Tea')

  const body = issueUrl.searchParams.get('body')
  assert.match(body, /## Recipe preset change/)
  assert.match(body, /### Change type\n\nAdd a new preset/)
  assert.match(body, /Existing preset ID: None/)
  assert.doesNotMatch(body, /Agent checklist/)
  assert.doesNotMatch(body, /built-in-recipes\.js/)
  assert.match(body, /```json/)
  assert.match(body, /"title": "Tacos & Tea"/)
  assert.match(body, /"ingredientLines": \[/)
  assert.match(body, /Submitted from Recipe Table Studio/)
})

test('creates a prefilled GitHub issue for an existing preset update', () => {
  const preset = {
    ...recipe,
    title: 'Original Tacos',
    note: 'Original note',
  }
  const issueUrl = new URL(createRecipeSubmissionIssueUrl(recipe, preset))

  assert.equal(issueUrl.searchParams.get('title'), '[Recipe Preset: Update] Tacos & Tea')

  const body = issueUrl.searchParams.get('body')
  assert.match(body, /## Recipe preset change/)
  assert.match(body, /### Change type\n\nUpdate an existing preset/)
  assert.match(body, /Existing preset ID: `recipe-123`/)
  assert.match(body, /Existing preset title: Original Tacos/)
  assert.doesNotMatch(body, /Agent checklist/)
  assert.doesNotMatch(body, /built-in-recipes\.js/)
  assert.match(body, /### Requested recipe JSON/)
  assert.match(body, /"title": "Tacos & Tea"/)
})

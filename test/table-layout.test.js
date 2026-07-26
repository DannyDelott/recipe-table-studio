import test from 'node:test'
import assert from 'node:assert/strict'

import { getConnectorSpan, getTableBoundaryRows } from '../src/table-layout.js'

test('connector stops where the neighboring action ends', () => {
  const coverage = Array.from({ length: 9 }, () => Array(3).fill(false))
  for (let row = 0; row < 8; row += 1) coverage[row][2] = true
  for (let row = 5; row < 8; row += 1) coverage[row][0] = true

  const actionColumns = [
    [{ start: 6, end: 8 }],
    [],
    [{ start: 1, end: 8 }],
  ]

  assert.equal(getConnectorSpan({
    row: 5,
    column: 1,
    ingredientCount: 9,
    columnCount: 3,
    coverage,
    actionColumns,
  }), 3)
})

test('connector can continue when no neighboring action introduces a boundary', () => {
  const coverage = Array.from({ length: 4 }, () => Array(1).fill(false))

  assert.equal(getConnectorSpan({
    row: 0,
    column: 0,
    ingredientCount: 4,
    columnCount: 1,
    coverage,
    actionColumns: [[]],
  }), 4)
})

test('table boundaries include ends and starts hidden by rowspans', () => {
  assert.deepEqual(getTableBoundaryRows({
    ingredientCount: 6,
    actionColumns: [[
      { start: 1, end: 2 },
      { start: 3, end: 4 },
    ], [{ start: 1, end: 6 }]],
  }), [2, 4])
})

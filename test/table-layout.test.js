import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getConnectorSpan,
  mergeActionConnectorCells,
  planConnectorCells,
} from '../src/table-layout.js'

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

test('plans connector cells for a branched recipe without leaving grid gaps', () => {
  const ingredientCount = 12
  const actionColumns = [
    [
      { start: 1, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 9 },
    ],
    [{ start: 8, end: 10 }],
    [{ start: 8, end: 11 }],
    [{ start: 4, end: 12 }],
    [{ start: 1, end: 12 }],
    [{ start: 1, end: 12 }],
    [{ start: 1, end: 12 }],
  ]
  const coverage = Array.from(
    { length: ingredientCount },
    () => Array(actionColumns.length).fill(false),
  )
  actionColumns.forEach((nodes, column) => {
    nodes.forEach((node) => {
      for (let row = node.start - 1; row < node.end; row += 1) {
        coverage[row][column] = true
      }
    })
  })

  const connectorCells = planConnectorCells({
    ingredientCount,
    columnCount: actionColumns.length,
    coverage,
    actionColumns,
  })
  const dryBranchGap = connectorCells.find((cell) =>
    cell.row === 3 && cell.column === 1)

  assert.deepEqual(dryBranchGap, {
    row: 3,
    column: 1,
    rowSpan: 4,
    colSpan: 2,
    joinsActionOnRight: true,
  })

  const tableCells = mergeActionConnectorCells(actionColumns, connectorCells)
  const appleAction = tableCells.actionCells.find((cell) =>
    cell.row === 0 && cell.column === 0)
  const dryAction = tableCells.actionCells.find((cell) =>
    cell.row === 3 && cell.column === 0)

  assert.equal(appleAction.colSpan, 4)
  assert.equal(dryAction.colSpan, 3)
  assert.equal(
    tableCells.connectorCells.some((cell) =>
      cell.row === 3 && cell.column === 1),
    false,
  )

  const renderedCoverage = Array.from(
    { length: ingredientCount },
    () => Array(actionColumns.length).fill(0),
  )
  const renderedCells = [...tableCells.actionCells, ...tableCells.connectorCells]
  renderedCells.forEach((cell) => {
    for (let row = cell.row; row < cell.row + cell.rowSpan; row += 1) {
      for (let column = cell.column;
        column < cell.column + cell.colSpan;
        column += 1) {
        renderedCoverage[row][column] += 1
      }
    }
  })

  assert.deepEqual(
    renderedCoverage,
    Array.from(
      { length: ingredientCount },
      () => Array(actionColumns.length).fill(1),
    ),
  )
})

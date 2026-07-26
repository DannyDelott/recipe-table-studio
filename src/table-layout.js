function uncoveredSpan(row, column, ingredientCount, coverage) {
  let span = 1
  while (row + span < ingredientCount && !coverage[row + span][column]) span += 1
  return span
}

function nearestActionSpan(row, column, direction, columnCount, coverage, actionColumns) {
  for (let candidateColumn = column + direction;
    candidateColumn >= 0 && candidateColumn < columnCount;
    candidateColumn += direction) {
    if (!coverage[row][candidateColumn]) continue
    const action = actionColumns[candidateColumn].find((node) =>
      node.start - 1 <= row && node.end - 1 >= row)
    return action ? action.end - row : Number.POSITIVE_INFINITY
  }
  return Number.POSITIVE_INFINITY
}

export function getConnectorSpan({
  row,
  column,
  ingredientCount,
  columnCount,
  coverage,
  actionColumns,
}) {
  const openSpan = uncoveredSpan(row, column, ingredientCount, coverage)
  const leftActionSpan = nearestActionSpan(
    row,
    column,
    -1,
    columnCount,
    coverage,
    actionColumns,
  )
  const rightActionSpan = nearestActionSpan(
    row,
    column,
    1,
    columnCount,
    coverage,
    actionColumns,
  )

  return Math.min(openSpan, leftActionSpan, rightActionSpan)
}

export function getTableBoundaryRows({ actionColumns, ingredientCount }) {
  const boundaries = new Set()

  actionColumns.flat().forEach((node) => {
    if (node.start > 1) boundaries.add(node.start - 1)
    if (node.end < ingredientCount) boundaries.add(node.end)
  })

  return [...boundaries].sort((a, b) => a - b)
}

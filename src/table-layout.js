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

export function planConnectorCells({
  ingredientCount,
  columnCount,
  coverage,
  actionColumns,
}) {
  const cells = []
  const connectorCoverage = Array.from(
    { length: ingredientCount },
    () => Array(columnCount).fill(false),
  )

  for (let row = 0; row < ingredientCount; row += 1) {
    let column = 0
    while (column < columnCount) {
      if (coverage[row][column] || connectorCoverage[row][column]) {
        column += 1
        continue
      }

      const rowSpan = getConnectorSpan({
        row,
        column,
        ingredientCount,
        columnCount,
        coverage,
        actionColumns,
      })

      let colSpan = 1
      while (column + colSpan < columnCount) {
        const nextColumn = column + colSpan
        if (coverage[row][nextColumn] || connectorCoverage[row][nextColumn]) break
        const nextRowSpan = getConnectorSpan({
          row,
          column: nextColumn,
          ingredientCount,
          columnCount,
          coverage,
          actionColumns,
        })
        if (nextRowSpan !== rowSpan) break
        colSpan += 1
      }

      for (let coveredRow = row; coveredRow < row + rowSpan; coveredRow += 1) {
        for (let coveredColumn = column;
          coveredColumn < column + colSpan;
          coveredColumn += 1) {
          connectorCoverage[coveredRow][coveredColumn] = true
        }
      }

      const joinsActionOnRight = Boolean(actionColumns[column + colSpan]
        ?.some((candidate) => candidate.start - 1 <= row && candidate.end > row))
      cells.push({ row, column, rowSpan, colSpan, joinsActionOnRight })
      column += colSpan
    }
  }

  return cells
}

export function mergeActionConnectorCells(actionColumns, connectorCells) {
  const connectorByStart = new Map(connectorCells.map((cell) => [
    `${cell.row}:${cell.column}`,
    cell,
  ]))
  const consumedConnectors = new Set()
  const actionCells = []

  actionColumns.forEach((nodes, column) => {
    nodes.forEach((node) => {
      const row = node.start - 1
      const rowSpan = node.end - node.start + 1
      const connectorKey = `${row}:${column + 1}`
      const connector = connectorByStart.get(connectorKey)
      const canAbsorbConnector = connector
        && connector.rowSpan === rowSpan
        && connector.joinsActionOnRight

      if (canAbsorbConnector) consumedConnectors.add(connectorKey)
      actionCells.push({
        row,
        column,
        rowSpan,
        colSpan: canAbsorbConnector ? connector.colSpan + 1 : 1,
      })
    })
  })

  return {
    actionCells,
    connectorCells: connectorCells.filter((cell) =>
      !consumedConnectors.has(`${cell.row}:${cell.column}`)),
  }
}

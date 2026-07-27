const CARD_WIDTH_MM = 220

export const PRINT_RASTER = {
  cardWidthMm: CARD_WIDTH_MM,
  columns: 720,
  maximumRows: 600,
  cellMm: CARD_WIDTH_MM / 720,
  minimumTextHeightMm: 3,
  minimumFontWeight: 700,
  detailStrokeMm: 0.8,
}

function borderIsVisible(style, side) {
  return style[`border${side}Style`] !== 'none'
    && style[`border${side}Style`] !== 'hidden'
    && Number.parseFloat(style[`border${side}Width`]) > 0
}

function wrapText(context, text, maximumWidth) {
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const lines = []
  let line = words.shift()

  words.forEach((word) => {
    const candidate = `${line} ${word}`
    if (context.measureText(candidate).width <= maximumWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  })
  lines.push(line)
  return lines
}

function drawCellText(context, cell, tableBounds, scale) {
  const text = cell.textContent.trim().replace(/\s+/g, ' ')
  if (!text) return

  const bounds = cell.getBoundingClientRect()
  const style = getComputedStyle(cell)
  const x = (bounds.left - tableBounds.left) * scale
  const y = (bounds.top - tableBounds.top) * scale
  const width = bounds.width * scale
  const height = bounds.height * scale
  const minimumFontSize = Math.ceil(PRINT_RASTER.minimumTextHeightMm / PRINT_RASTER.cellMm)
  let fontSize = Math.max(minimumFontSize, Number.parseFloat(style.fontSize) * scale)
  const sourceWeight = Number.parseInt(style.fontWeight, 10) || 500
  const weight = Math.max(PRINT_RASTER.minimumFontWeight, sourceWeight)
  const family = style.fontFamily || 'Arial, Helvetica, sans-serif'
  const horizontalPadding = Math.max(4, Number.parseFloat(style.paddingLeft) * scale)
  const verticalPadding = Math.max(3, Number.parseFloat(style.paddingTop) * scale)
  const maximumWidth = Math.max(4, width - horizontalPadding * 2)
  const maximumHeight = Math.max(5, height - verticalPadding * 2)

  context.fillStyle = '#000'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  let lines = []
  let lineHeight = 0
  while (fontSize >= minimumFontSize) {
    context.font = `${weight} ${fontSize}px ${family}`
    lines = wrapText(context, text, maximumWidth)
    lineHeight = fontSize * 1.18
    if (lines.length * lineHeight <= maximumHeight) break
    fontSize -= 0.5
  }
  fontSize = Math.max(minimumFontSize, fontSize)
  context.font = `${weight} ${fontSize}px ${family}`
  lines = wrapText(context, text, maximumWidth)
  lineHeight = fontSize * 1.18

  const maximumLines = Math.max(1, Math.floor(maximumHeight / lineHeight))
  if (lines.length > maximumLines) {
    lines = lines.slice(0, maximumLines)
    const lastIndex = lines.length - 1
    while (lines[lastIndex].length > 1
      && context.measureText(`${lines[lastIndex]}…`).width > maximumWidth) {
      lines[lastIndex] = lines[lastIndex].slice(0, -1)
    }
    lines[lastIndex] = `${lines[lastIndex]}…`
  }

  const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight
    context.fillText(line, x + width / 2, lineY)
  })
}

function drawCellBorders(context, cell, tableBounds, scale) {
  const bounds = cell.getBoundingClientRect()
  const style = getComputedStyle(cell)
  const x1 = (bounds.left - tableBounds.left) * scale
  const x2 = (bounds.right - tableBounds.left) * scale
  const y1 = (bounds.top - tableBounds.top) * scale
  const y2 = (bounds.bottom - tableBounds.top) * scale

  context.strokeStyle = '#000'
  context.lineWidth = Math.ceil(PRINT_RASTER.detailStrokeMm / PRINT_RASTER.cellMm)
  context.lineCap = 'square'
  context.beginPath()
  if (borderIsVisible(style, 'Top')) {
    context.moveTo(x1, y1)
    context.lineTo(x2, y1)
  }
  if (borderIsVisible(style, 'Right')) {
    context.moveTo(x2, y1)
    context.lineTo(x2, y2)
  }
  if (borderIsVisible(style, 'Bottom')) {
    context.moveTo(x1, y2)
    context.lineTo(x2, y2)
  }
  if (borderIsVisible(style, 'Left')) {
    context.moveTo(x1, y1)
    context.lineTo(x1, y2)
  }
  context.stroke()
}

function canvasToRaster(context, columns, rows, threshold = 205) {
  const pixels = context.getImageData(0, 0, columns, rows).data
  const raster = Array.from({ length: rows }, () => new Uint8Array(columns))
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = (y * columns + x) * 4
      const luminance = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
      raster[y][x] = luminance < threshold ? 1 : 0
    }
  }
  return raster
}

function combineRasters(...rasters) {
  const rows = rasters[0].length
  const columns = rasters[0][0].length
  const combined = Array.from({ length: rows }, () => new Uint8Array(columns))
  rasters.forEach((raster) => {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        if (raster[y][x]) combined[y][x] = 1
      }
    }
  })
  return combined
}

function makeLayer(columns, rows) {
  const canvas = document.createElement('canvas')
  canvas.width = columns
  canvas.height = rows
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.fillStyle = '#fff'
  context.fillRect(0, 0, columns, rows)
  return { canvas, context }
}

export function captureRecipeTableRaster(tableContainer) {
  const table = tableContainer.querySelector('.recipe-table')
  if (!table) throw new Error('Add ingredients before creating a 3D recipe card.')

  const tableBounds = table.getBoundingClientRect()
  if (!tableBounds.width || !tableBounds.height) throw new Error('The recipe table is not visible.')

  let columns = PRINT_RASTER.columns
  let scale = columns / tableBounds.width
  let rows = Math.ceil(tableBounds.height * scale)
  if (rows > PRINT_RASTER.maximumRows) {
    rows = PRINT_RASTER.maximumRows
    scale = rows / tableBounds.height
    columns = Math.ceil(tableBounds.width * scale)
  }

  const borderLayer = makeLayer(columns, rows)
  const textLayer = makeLayer(columns, rows)
  const cells = []

  table.querySelectorAll('th, td').forEach((cell) => {
    drawCellBorders(borderLayer.context, cell, tableBounds, scale)
    drawCellText(textLayer.context, cell, tableBounds, scale)
    const bounds = cell.getBoundingClientRect()
    const rowIndex = cell.parentElement?.rowIndex ?? 2
    cells.push({
      text: cell.textContent.trim().replace(/\s+/g, ' '),
      x: (bounds.left - tableBounds.left) * scale,
      y: (bounds.top - tableBounds.top) * scale,
      width: bounds.width * scale,
      height: bounds.height * scale,
      role: cell.tagName === 'TH' ? 'title' : rowIndex === 1 ? 'note' : 'body',
    })
  })

  tableContainer.querySelectorAll('.table-boundary').forEach((boundary) => {
    const bounds = boundary.getBoundingClientRect()
    const y = (bounds.top - tableBounds.top) * scale
    borderLayer.context.strokeStyle = '#000'
    borderLayer.context.lineWidth = Math.ceil(PRINT_RASTER.detailStrokeMm / PRINT_RASTER.cellMm)
    borderLayer.context.beginPath()
    borderLayer.context.moveTo(0, y)
    borderLayer.context.lineTo(columns, y)
    borderLayer.context.stroke()
  })

  borderLayer.context.strokeStyle = '#000'
  borderLayer.context.lineWidth = Math.ceil(PRINT_RASTER.detailStrokeMm / PRINT_RASTER.cellMm)
  borderLayer.context.strokeRect(1, 1, columns - 2, rows - 2)

  const borderRaster = canvasToRaster(borderLayer.context, columns, rows)
  const textRaster = canvasToRaster(textLayer.context, columns, rows)
  const raster = combineRasters(borderRaster, textRaster)

  return {
    raster,
    borderRaster,
    cells,
    columns,
    rows,
    sourceWidth: tableBounds.width,
    sourceHeight: tableBounds.height,
  }
}

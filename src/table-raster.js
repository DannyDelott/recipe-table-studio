const TARGET_COLUMNS = 360
const MAXIMUM_ROWS = 300

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
  let fontSize = Math.max(5, Number.parseFloat(style.fontSize) * scale)
  const weight = Number.parseInt(style.fontWeight, 10) || style.fontWeight || 500
  const family = style.fontFamily || 'sans-serif'
  const horizontalPadding = Math.max(4, Number.parseFloat(style.paddingLeft) * scale)
  const verticalPadding = Math.max(3, Number.parseFloat(style.paddingTop) * scale)
  const maximumWidth = Math.max(4, width - horizontalPadding * 2)
  const maximumHeight = Math.max(5, height - verticalPadding * 2)

  context.fillStyle = '#000'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  let lines = []
  let lineHeight = 0
  while (fontSize >= 4) {
    context.font = `${weight} ${fontSize}px ${family}`
    lines = wrapText(context, text, maximumWidth)
    lineHeight = fontSize * 1.18
    if (lines.length * lineHeight <= maximumHeight) break
    fontSize -= 0.5
  }

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
  lines.forEach((line, index) => context.fillText(line, x + width / 2, startY + index * lineHeight))
}

function drawCellBorders(context, cell, tableBounds, scale) {
  const bounds = cell.getBoundingClientRect()
  const style = getComputedStyle(cell)
  const x1 = (bounds.left - tableBounds.left) * scale
  const x2 = (bounds.right - tableBounds.left) * scale
  const y1 = (bounds.top - tableBounds.top) * scale
  const y2 = (bounds.bottom - tableBounds.top) * scale

  context.strokeStyle = '#000'
  context.lineWidth = 1.4
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

export function captureRecipeTableRaster(tableContainer) {
  const table = tableContainer.querySelector('.recipe-table')
  if (!table) throw new Error('Add ingredients before creating a 3D recipe card.')

  const tableBounds = table.getBoundingClientRect()
  if (!tableBounds.width || !tableBounds.height) throw new Error('The recipe table is not visible.')

  let columns = TARGET_COLUMNS
  let scale = columns / tableBounds.width
  let rows = Math.ceil(tableBounds.height * scale)
  if (rows > MAXIMUM_ROWS) {
    rows = MAXIMUM_ROWS
    scale = rows / tableBounds.height
    columns = Math.ceil(tableBounds.width * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = columns
  canvas.height = rows
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.fillStyle = '#fff'
  context.fillRect(0, 0, columns, rows)

  table.querySelectorAll('th, td').forEach((cell) => {
    drawCellBorders(context, cell, tableBounds, scale)
    drawCellText(context, cell, tableBounds, scale)
  })

  tableContainer.querySelectorAll('.table-boundary').forEach((boundary) => {
    const bounds = boundary.getBoundingClientRect()
    const y = (bounds.top - tableBounds.top) * scale
    context.strokeStyle = '#000'
    context.lineWidth = 1.4
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(columns, y)
    context.stroke()
  })

  context.strokeStyle = '#000'
  context.lineWidth = 2
  context.strokeRect(1, 1, columns - 2, rows - 2)

  const pixels = context.getImageData(0, 0, columns, rows).data
  const raster = Array.from({ length: rows }, () => new Uint8Array(columns))
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = (y * columns + x) * 4
      const luminance = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
      raster[y][x] = luminance < 205 ? 1 : 0
    }
  }

  return {
    raster,
    sourceWidth: tableBounds.width,
    sourceHeight: tableBounds.height,
  }
}

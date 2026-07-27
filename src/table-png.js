const EXPORT_SCALE = 2

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

function cellGeometry(cell, tableBounds, scale) {
  const bounds = cell.getBoundingClientRect()
  return {
    x: (bounds.left - tableBounds.left) * scale,
    y: (bounds.top - tableBounds.top) * scale,
    width: bounds.width * scale,
    height: bounds.height * scale,
  }
}

function drawCellBackground(context, cell, tableBounds, scale) {
  const { x, y, width, height } = cellGeometry(cell, tableBounds, scale)
  context.fillStyle = getComputedStyle(cell).backgroundColor
  context.fillRect(x, y, width, height)
}

function drawCellBorders(context, cell, tableBounds, scale) {
  const { x, y, width, height } = cellGeometry(cell, tableBounds, scale)
  const style = getComputedStyle(cell)
  const sides = [
    ['Top', x, y, x + width, y],
    ['Right', x + width, y, x + width, y + height],
    ['Bottom', x, y + height, x + width, y + height],
    ['Left', x, y, x, y + height],
  ]

  context.lineCap = 'square'
  sides.forEach(([side, x1, y1, x2, y2]) => {
    if (!borderIsVisible(style, side)) return
    context.beginPath()
    context.strokeStyle = style[`border${side}Color`]
    context.lineWidth = Math.max(1, Number.parseFloat(style[`border${side}Width`]) * scale)
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
  })
}

function drawCellText(context, cell, tableBounds, scale) {
  const text = cell.textContent.trim().replace(/\s+/g, ' ')
  if (!text) return

  const { x, y, width, height } = cellGeometry(cell, tableBounds, scale)
  const style = getComputedStyle(cell)
  const horizontalPadding = (Number.parseFloat(style.paddingLeft)
    + Number.parseFloat(style.paddingRight)) * scale
  const verticalPadding = (Number.parseFloat(style.paddingTop)
    + Number.parseFloat(style.paddingBottom)) * scale
  const maximumWidth = Math.max(1, width - horizontalPadding)
  const maximumHeight = Math.max(1, height - verticalPadding)
  let fontSize = Number.parseFloat(style.fontSize) * scale
  const minimumFontSize = Math.max(10, fontSize * 0.72)
  const lineHeightRatio = Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize)
  const weight = style.fontWeight || '400'
  const family = style.fontFamily || 'sans-serif'
  let lines = []
  let lineHeight = 0

  while (fontSize >= minimumFontSize) {
    context.font = `${weight} ${fontSize}px ${family}`
    lines = wrapText(context, text, maximumWidth)
    lineHeight = fontSize * (Number.isFinite(lineHeightRatio) ? lineHeightRatio : 1.3)
    if (lines.length * lineHeight <= maximumHeight) break
    fontSize -= 0.5
  }

  context.fillStyle = style.color
  context.font = `${weight} ${fontSize}px ${family}`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, index) => {
    context.fillText(line, x + width / 2, startY + index * lineHeight)
  })
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The recipe PNG could not be created.'))
    }, 'image/png')
  })
}

export async function captureRecipeTablePng(tableContainer) {
  const table = tableContainer.querySelector('.recipe-table')
  if (!table) throw new Error('Add ingredients before copying a recipe PNG.')

  await document.fonts.ready
  const tableBounds = table.getBoundingClientRect()
  if (!tableBounds.width || !tableBounds.height) throw new Error('The recipe table is not visible.')

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(tableBounds.width * EXPORT_SCALE)
  canvas.height = Math.ceil(tableBounds.height * EXPORT_SCALE)
  const context = canvas.getContext('2d')
  const cells = [...table.querySelectorAll('th, td')]

  context.fillStyle = getComputedStyle(table).backgroundColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  cells.forEach((cell) => drawCellBackground(context, cell, tableBounds, EXPORT_SCALE))
  cells.forEach((cell) => drawCellBorders(context, cell, tableBounds, EXPORT_SCALE))
  cells.forEach((cell) => drawCellText(context, cell, tableBounds, EXPORT_SCALE))

  return canvasToPngBlob(canvas)
}

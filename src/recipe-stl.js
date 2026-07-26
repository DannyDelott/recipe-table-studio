const FONT = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '00100', '00100', '01000'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
}

export const STL_CARD = {
  widthMm: 180,
  cellMm: 0.9,
  baseHeightMm: 2.4,
  reliefHeightMm: 0.8,
  columns: 200,
  minimumRows: 120,
  maximumRows: 180,
}

function recipeLines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean)
}

function cleanText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function truncateText(value, maximumLength) {
  const text = cleanText(value)
  if (text.length <= maximumLength) return text
  return maximumLength > 3 ? `${text.slice(0, maximumLength - 3)}...` : text.slice(0, maximumLength)
}

function makeRaster(columns, rows) {
  return Array.from({ length: rows }, () => new Uint8Array(columns))
}

function markPixel(raster, x, y) {
  if (y >= 0 && y < raster.length && x >= 0 && x < raster[0].length) raster[y][x] = 1
}

function drawLine(raster, x1, y1, x2, y2, thickness = 1) {
  const dx = Math.abs(x2 - x1)
  const sx = x1 < x2 ? 1 : -1
  const dy = -Math.abs(y2 - y1)
  const sy = y1 < y2 ? 1 : -1
  let error = dx + dy
  let x = x1
  let y = y1
  const radius = Math.max(0, Math.floor((thickness - 1) / 2))

  while (true) {
    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) markPixel(raster, x + ox, y + oy)
    }
    if (x === x2 && y === y2) break
    const doubled = 2 * error
    if (doubled >= dy) {
      error += dy
      x += sx
    }
    if (doubled <= dx) {
      error += dx
      y += sy
    }
  }
}

function textWidth(text, scale = 1) {
  return Math.max(0, cleanText(text).length * 6 * scale - scale)
}

function drawText(raster, text, x, y, scale = 1) {
  let cursor = x
  for (const character of cleanText(text)) {
    const glyph = FONT[character] || FONT['?']
    glyph.forEach((row, rowIndex) => {
      ;[...row].forEach((pixel, columnIndex) => {
        if (pixel !== '1') return
        for (let oy = 0; oy < scale; oy += 1) {
          for (let ox = 0; ox < scale; ox += 1) {
            markPixel(raster, cursor + columnIndex * scale + ox, y + rowIndex * scale + oy)
          }
        }
      })
    })
    cursor += 6 * scale
  }
}

function drawCenteredText(raster, text, y, scale, left = 0, right = raster[0].length) {
  const x = left + Math.max(0, Math.floor((right - left - textWidth(text, scale)) / 2))
  drawText(raster, text, x, y, scale)
}

function resolveDiagonalContacts(raster) {
  let changed = true
  while (changed) {
    changed = false
    for (let y = 0; y < raster.length - 1; y += 1) {
      for (let x = 0; x < raster[0].length - 1; x += 1) {
        const topLeft = raster[y][x]
        const topRight = raster[y][x + 1]
        const bottomLeft = raster[y + 1][x]
        const bottomRight = raster[y + 1][x + 1]
        if (topLeft && bottomRight && !topRight && !bottomLeft) {
          raster[y][x + 1] = 1
          changed = true
        } else if (topRight && bottomLeft && !topLeft && !bottomRight) {
          raster[y][x] = 1
          changed = true
        }
      }
    }
  }
}

function buildCardRaster(recipe) {
  const ingredients = recipeLines(recipe.ingredients)
  const actions = (Array.isArray(recipe.actions) ? recipe.actions : [])
    .map((action) => cleanText(action.text))
    .filter(Boolean)
  const itemCount = Math.max(ingredients.length, actions.length, 1)
  const rows = Math.min(
    STL_CARD.maximumRows,
    Math.max(STL_CARD.minimumRows, 39 + itemCount * 9),
  )
  const raster = makeRaster(STL_CARD.columns, rows)
  const rightEdge = STL_CARD.columns - 2
  const bottomEdge = rows - 2
  const divider = 106
  const contentTop = 35

  drawLine(raster, 1, 1, rightEdge, 1, 2)
  drawLine(raster, 1, bottomEdge, rightEdge, bottomEdge, 2)
  drawLine(raster, 1, 1, 1, bottomEdge, 2)
  drawLine(raster, rightEdge, 1, rightEdge, bottomEdge, 2)
  drawLine(raster, 1, 20, rightEdge, 20)
  drawLine(raster, 1, 32, rightEdge, 32)
  drawLine(raster, divider, 32, divider, bottomEdge)

  const title = truncateText(recipe.title || 'Untitled recipe', 16)
  drawCenteredText(raster, title, 4, 2, 3, rightEdge - 2)

  const note = truncateText(recipe.note || 'RECIPE TABLE', 31)
  drawCenteredText(raster, note, 23, 1, 3, rightEdge - 2)

  const ingredientRows = Math.max(ingredients.length, 1)
  const ingredientHeight = Math.max(9, Math.floor((bottomEdge - contentTop) / ingredientRows))
  ingredients.slice(0, Math.floor((bottomEdge - contentTop) / 9)).forEach((ingredient, index) => {
    const y = contentTop + index * ingredientHeight
    if (index) drawLine(raster, 1, y - 2, divider, y - 2)
    const label = truncateText(`${index + 1} ${ingredient}`, 16)
    drawText(raster, label, 5, y, 1)
  })

  const actionRows = Math.max(actions.length, 1)
  const actionHeight = Math.max(9, Math.floor((bottomEdge - contentTop) / actionRows))
  actions.slice(0, Math.floor((bottomEdge - contentTop) / 9)).forEach((action, index) => {
    const y = contentTop + index * actionHeight
    if (index) drawLine(raster, divider, y - 2, rightEdge, y - 2)
    const label = truncateText(`${index + 1} ${action}`, 14)
    drawText(raster, label, divider + 5, y, 1)
  })

  resolveDiagonalContacts(raster)
  return { raster, ingredients, actions }
}

function triangleNormal(a, b, c) {
  const ux = b[0] - a[0]
  const uy = b[1] - a[1]
  const uz = b[2] - a[2]
  const vx = c[0] - a[0]
  const vy = c[1] - a[1]
  const vz = c[2] - a[2]
  const nx = uy * vz - uz * vy
  const ny = uz * vx - ux * vz
  const nz = ux * vy - uy * vx
  const length = Math.hypot(nx, ny, nz) || 1
  return [nx / length, ny / length, nz / length]
}

function writeTriangle(view, offset, a, b, c) {
  const normal = triangleNormal(a, b, c)
  ;[...normal, ...a, ...b, ...c].forEach((value, index) => {
    view.setFloat32(offset + index * 4, value, true)
  })
  view.setUint16(offset + 48, 0, true)
  return offset + 50
}

function cellHeight(raster, x, y) {
  return STL_CARD.baseHeightMm + raster[y][x] * STL_CARD.reliefHeightMm
}

function countTriangles(raster) {
  const rows = raster.length
  const columns = raster[0].length
  let count = rows * columns * 4
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const height = cellHeight(raster, x, y)
      if (x === 0 || height > cellHeight(raster, x - 1, y)) count += 2
      if (x === columns - 1 || height > cellHeight(raster, x + 1, y)) count += 2
      if (y === 0 || height > cellHeight(raster, x, y - 1)) count += 2
      if (y === rows - 1 || height > cellHeight(raster, x, y + 1)) count += 2
    }
  }
  return count
}

function writeVerticalQuad(view, offset, side, fixed, start, end, low, high) {
  if (side === 'left') {
    const b0 = [fixed, start, low]
    const b1 = [fixed, end, low]
    const t0 = [fixed, start, high]
    const t1 = [fixed, end, high]
    offset = writeTriangle(view, offset, b0, t0, t1)
    return writeTriangle(view, offset, b0, t1, b1)
  }
  if (side === 'right') {
    const b0 = [fixed, start, low]
    const b1 = [fixed, end, low]
    const t0 = [fixed, start, high]
    const t1 = [fixed, end, high]
    offset = writeTriangle(view, offset, b0, b1, t1)
    return writeTriangle(view, offset, b0, t1, t0)
  }
  if (side === 'bottom') {
    const b0 = [start, fixed, low]
    const b1 = [end, fixed, low]
    const t0 = [start, fixed, high]
    const t1 = [end, fixed, high]
    offset = writeTriangle(view, offset, b0, b1, t1)
    return writeTriangle(view, offset, b0, t1, t0)
  }
  const b0 = [start, fixed, low]
  const b1 = [end, fixed, low]
  const t0 = [start, fixed, high]
  const t1 = [end, fixed, high]
  offset = writeTriangle(view, offset, b0, t0, t1)
  return writeTriangle(view, offset, b0, t1, b1)
}

function rasterToBinaryStl(raster, title) {
  const rows = raster.length
  const columns = raster[0].length
  const triangleCount = countTriangles(raster)
  const buffer = new ArrayBuffer(84 + triangleCount * 50)
  const bytes = new Uint8Array(buffer)
  const header = new TextEncoder().encode(`Recipe Table Studio | ${cleanText(title).slice(0, 52)}`)
  bytes.set(header.slice(0, 80), 0)
  const view = new DataView(buffer)
  view.setUint32(80, triangleCount, true)
  let offset = 84
  const halfWidth = (columns * STL_CARD.cellMm) / 2
  const halfHeight = (rows * STL_CARD.cellMm) / 2

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const x0 = x * STL_CARD.cellMm - halfWidth
      const x1 = x0 + STL_CARD.cellMm
      const y1 = halfHeight - y * STL_CARD.cellMm
      const y0 = y1 - STL_CARD.cellMm
      const height = cellHeight(raster, x, y)
      const p00 = [x0, y0, height]
      const p10 = [x1, y0, height]
      const p11 = [x1, y1, height]
      const p01 = [x0, y1, height]

      offset = writeTriangle(view, offset, p00, p10, p11)
      offset = writeTriangle(view, offset, p00, p11, p01)
      offset = writeTriangle(view, offset, [x0, y0, 0], [x0, y1, 0], [x1, y1, 0])
      offset = writeTriangle(view, offset, [x0, y0, 0], [x1, y1, 0], [x1, y0, 0])

      const leftHeight = x > 0 ? cellHeight(raster, x - 1, y) : 0
      const rightHeight = x < columns - 1 ? cellHeight(raster, x + 1, y) : 0
      const bottomHeight = y < rows - 1 ? cellHeight(raster, x, y + 1) : 0
      const topHeight = y > 0 ? cellHeight(raster, x, y - 1) : 0
      if (height > leftHeight) offset = writeVerticalQuad(view, offset, 'left', x0, y0, y1, leftHeight, height)
      if (height > rightHeight) offset = writeVerticalQuad(view, offset, 'right', x1, y0, y1, rightHeight, height)
      if (height > bottomHeight) offset = writeVerticalQuad(view, offset, 'bottom', y0, x0, x1, bottomHeight, height)
      if (height > topHeight) offset = writeVerticalQuad(view, offset, 'top', y1, x0, x1, topHeight, height)
    }
  }

  return { buffer, triangleCount }
}

export function createRecipeStl(recipe) {
  const { raster, ingredients, actions } = buildCardRaster(recipe)
  const { buffer, triangleCount } = rasterToBinaryStl(raster, recipe.title)
  return {
    buffer,
    metadata: {
      widthMm: STL_CARD.widthMm,
      heightMm: raster.length * STL_CARD.cellMm,
      depthMm: STL_CARD.baseHeightMm + STL_CARD.reliefHeightMm,
      triangleCount,
      ingredientCount: ingredients.length,
      actionCount: actions.length,
    },
  }
}

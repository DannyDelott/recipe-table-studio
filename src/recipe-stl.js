import { strToU8, zipSync } from 'fflate'

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
  widthMm: 220,
  cellMm: 0.9,
  baseHeightMm: 2.4,
  reliefHeightMm: 0.4,
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

function rasterToBinaryStl(raster, title, cellMm = STL_CARD.cellMm) {
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
  const halfWidth = (columns * cellMm) / 2
  const halfHeight = (rows * cellMm) / 2

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const x0 = x * cellMm - halfWidth
      const x1 = x0 + cellMm
      const y1 = halfHeight - y * cellMm
      const y0 = y1 - cellMm
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

function indexedMeshToBinaryStl(mesh, title) {
  const buffer = new ArrayBuffer(84 + mesh.triangles.length * 50)
  const bytes = new Uint8Array(buffer)
  const header = new TextEncoder().encode(`Recipe Table Studio | ${cleanText(title).slice(0, 52)}`)
  bytes.set(header.slice(0, 80), 0)
  const view = new DataView(buffer)
  view.setUint32(80, mesh.triangles.length, true)
  let offset = 84
  mesh.triangles.forEach(([a, b, c]) => {
    offset = writeTriangle(view, offset, mesh.vertices[a], mesh.vertices[b], mesh.vertices[c])
  })
  return buffer
}

function createBaseMesh(widthMm, heightMm) {
  const halfWidth = widthMm / 2
  const halfHeight = heightMm / 2
  const z = STL_CARD.baseHeightMm
  return {
    vertices: [
      [-halfWidth, -halfHeight, 0],
      [halfWidth, -halfHeight, 0],
      [halfWidth, halfHeight, 0],
      [-halfWidth, halfHeight, 0],
      [-halfWidth, -halfHeight, z],
      [halfWidth, -halfHeight, z],
      [halfWidth, halfHeight, z],
      [-halfWidth, halfHeight, z],
    ],
    triangles: [
      [0, 2, 1], [0, 3, 2],
      [4, 5, 6], [4, 6, 7],
      [0, 1, 5], [0, 5, 4],
      [1, 2, 6], [1, 6, 5],
      [2, 3, 7], [2, 7, 6],
      [3, 0, 4], [3, 4, 7],
    ],
  }
}

function countDetailTriangles(raster) {
  const rows = raster.length
  const columns = raster[0].length
  let count = 0
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!raster[y][x]) continue
      count += 4
      if (x === 0 || !raster[y][x - 1]) count += 2
      if (x === columns - 1 || !raster[y][x + 1]) count += 2
      if (y === 0 || !raster[y - 1][x]) count += 2
      if (y === rows - 1 || !raster[y + 1][x]) count += 2
    }
  }
  return count
}

function detailRasterToBinaryStl(raster, title, cellMm) {
  const rows = raster.length
  const columns = raster[0].length
  const triangleCount = countDetailTriangles(raster)
  const buffer = new ArrayBuffer(84 + triangleCount * 50)
  const bytes = new Uint8Array(buffer)
  const header = new TextEncoder().encode(`Recipe Table Studio details | ${cleanText(title).slice(0, 44)}`)
  bytes.set(header.slice(0, 80), 0)
  const view = new DataView(buffer)
  view.setUint32(80, triangleCount, true)
  const halfWidth = (columns * cellMm) / 2
  const halfHeight = (rows * cellMm) / 2
  const low = STL_CARD.baseHeightMm
  const high = low + STL_CARD.reliefHeightMm
  let offset = 84

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!raster[y][x]) continue
      const x0 = x * cellMm - halfWidth
      const x1 = x0 + cellMm
      const y1 = halfHeight - y * cellMm
      const y0 = y1 - cellMm
      const p00 = [x0, y0, high]
      const p10 = [x1, y0, high]
      const p11 = [x1, y1, high]
      const p01 = [x0, y1, high]

      offset = writeTriangle(view, offset, p00, p10, p11)
      offset = writeTriangle(view, offset, p00, p11, p01)
      offset = writeTriangle(view, offset, [x0, y0, low], [x0, y1, low], [x1, y1, low])
      offset = writeTriangle(view, offset, [x0, y0, low], [x1, y1, low], [x1, y0, low])

      if (x === 0 || !raster[y][x - 1]) {
        offset = writeVerticalQuad(view, offset, 'left', x0, y0, y1, low, high)
      }
      if (x === columns - 1 || !raster[y][x + 1]) {
        offset = writeVerticalQuad(view, offset, 'right', x1, y0, y1, low, high)
      }
      if (y === rows - 1 || !raster[y + 1][x]) {
        offset = writeVerticalQuad(view, offset, 'bottom', y0, x0, x1, low, high)
      }
      if (y === 0 || !raster[y - 1][x]) {
        offset = writeVerticalQuad(view, offset, 'top', y1, x0, x1, low, high)
      }
    }
  }

  return { buffer, triangleCount }
}

function stlToIndexedMesh(buffer) {
  const view = new DataView(buffer)
  const triangleCount = view.getUint32(80, true)
  const vertices = []
  const triangles = []
  const vertexIndexes = new Map()

  function vertexAt(offset) {
    const vertex = [0, 1, 2].map((axis) => view.getFloat32(offset + axis * 4, true))
    const key = vertex.map((value) => (Math.abs(value) < 0.00005 ? 0 : value).toFixed(5)).join(',')
    if (!vertexIndexes.has(key)) {
      vertexIndexes.set(key, vertices.length)
      vertices.push(vertex)
    }
    return vertexIndexes.get(key)
  }

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = 84 + triangle * 50 + 12
    triangles.push([
      vertexAt(offset),
      vertexAt(offset + 12),
      vertexAt(offset + 24),
    ])
  }
  return { vertices, triangles }
}

function mergeIndexedMeshes(...meshes) {
  const merged = { vertices: [], triangles: [] }
  meshes.filter(Boolean).forEach((mesh) => {
    const offset = merged.vertices.length
    mesh.vertices.forEach((vertex) => merged.vertices.push(vertex))
    mesh.triangles.forEach(([a, b, c]) => merged.triangles.push([
      a + offset,
      b + offset,
      c + offset,
    ]))
  })
  return merged
}

function threeGeometryToIndexedMesh(geometry) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry
  const positions = source.getAttribute('position')
  const mesh = { vertices: [], triangles: [] }
  for (let index = 0; index < positions.count; index += 3) {
    const start = mesh.vertices.length
    mesh.vertices.push(
      [positions.getX(index), positions.getY(index), positions.getZ(index)],
      [positions.getX(index + 1), positions.getY(index + 1), positions.getZ(index + 1)],
      [positions.getX(index + 2), positions.getY(index + 2), positions.getZ(index + 2)],
    )
    mesh.triangles.push([start, start + 1, start + 2])
  }
  if (source !== geometry) source.dispose()
  return mesh
}

function textAdvance(font, text, size) {
  const resolution = font.data.resolution || 1000
  const fallback = font.data.glyphs['?'] || font.data.glyphs[' ']
  return [...text].reduce((width, character) => {
    const glyph = font.data.glyphs[character] || fallback
    return width + ((glyph?.ha || resolution * 0.5) * size) / resolution
  }, 0)
}

function partitionWords(font, words, size, lineCount) {
  const count = words.length
  const states = Array.from({ length: lineCount + 1 }, () => Array(count + 1).fill(null))
  states[0][0] = { maximumWidth: 0, lines: [] }

  for (let lines = 1; lines <= lineCount; lines += 1) {
    for (let end = lines; end <= count; end += 1) {
      for (let start = lines - 1; start < end; start += 1) {
        const previous = states[lines - 1][start]
        if (!previous) continue
        const line = words.slice(start, end).join(' ')
        const width = textAdvance(font, line, size)
        const maximumWidth = Math.max(previous.maximumWidth, width)
        const current = states[lines][end]
        if (!current || maximumWidth < current.maximumWidth) {
          states[lines][end] = {
            maximumWidth,
            lines: [...previous.lines, line],
          }
        }
      }
    }
  }
  return states[lineCount][count]
}

function fitVectorText(font, text, role, widthMm, heightMm) {
  const settings = {
    title: { size: 6.2, minimumSize: 5, padding: 2.2, lineHeight: 1.18 },
    note: { size: 4.2, minimumSize: 3.4, padding: 1.8, lineHeight: 1.2 },
    body: { size: 3.8, minimumSize: 3.1, padding: 1.4, lineHeight: 1.22 },
  }[role] || { size: 3.8, minimumSize: 3.1, padding: 1.4, lineHeight: 1.22 }
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  const availableWidth = Math.max(1, widthMm - settings.padding * 2)
  const availableHeight = Math.max(1, heightMm - settings.padding * 2)
  let size = settings.size
  let best = null

  while (size >= settings.minimumSize - 0.001) {
    const lineHeight = size * settings.lineHeight
    const maximumLines = Math.max(1, Math.min(words.length, Math.floor(availableHeight / lineHeight)))
    for (let lineCount = 1; lineCount <= maximumLines; lineCount += 1) {
      const candidate = partitionWords(font, words, size, lineCount)
      if (!candidate) continue
      const scaleX = Math.min(1, availableWidth / Math.max(candidate.maximumWidth, 0.001))
      const score = scaleX - (lineCount - 1) * 0.012
      if (!best || score > best.score) {
        best = {
          lines: candidate.lines,
          size,
          lineHeight,
          scaleX,
          score,
        }
      }
    }
    if (best?.scaleX >= 0.9) break
    size -= 0.2
  }

  return best || {
    lines: [text],
    size: settings.minimumSize,
    lineHeight: settings.minimumSize * settings.lineHeight,
    scaleX: Math.min(1, availableWidth / Math.max(textAdvance(font, text, settings.minimumSize), 0.001)),
  }
}

function createVectorTextMesh(capturedLayout, font, TextGeometry, cellMm) {
  const widthMm = capturedLayout.columns * cellMm
  const heightMm = capturedLayout.rows * cellMm
  const halfWidth = widthMm / 2
  const halfHeight = heightMm / 2
  const meshes = []
  const renderedText = []
  let minimumFontSizeMm = Infinity
  let minimumHorizontalScale = Infinity

  capturedLayout.cells.filter((cell) => cell.text).forEach((cell) => {
    const cellWidth = cell.width * cellMm
    const cellHeight = cell.height * cellMm
    const cellCenterX = cell.x * cellMm + cellWidth / 2 - halfWidth
    const cellCenterY = halfHeight - (cell.y * cellMm + cellHeight / 2)
    const fitted = fitVectorText(font, cell.text, cell.role, cellWidth, cellHeight)
    minimumFontSizeMm = Math.min(minimumFontSizeMm, fitted.size)
    minimumHorizontalScale = Math.min(minimumHorizontalScale, fitted.scaleX)
    const blockHeight = (fitted.lines.length - 1) * fitted.lineHeight

    fitted.lines.forEach((line, lineIndex) => {
      const geometry = new TextGeometry(line, {
        font,
        size: fitted.size,
        depth: STL_CARD.reliefHeightMm,
        curveSegments: 2,
        bevelEnabled: false,
      })
      geometry.computeBoundingBox()
      const bounds = geometry.boundingBox
      const centerX = (bounds.min.x + bounds.max.x) / 2
      const centerY = (bounds.min.y + bounds.max.y) / 2
      const lineCenterY = cellCenterY + blockHeight / 2 - lineIndex * fitted.lineHeight
      geometry.scale(fitted.scaleX, 1, 1)
      geometry.translate(
        cellCenterX - centerX * fitted.scaleX,
        lineCenterY - centerY,
        STL_CARD.baseHeightMm,
      )
      meshes.push(threeGeometryToIndexedMesh(geometry))
      geometry.dispose()
    })
    renderedText.push(cell.text)
  })

  return {
    mesh: mergeIndexedMeshes(...meshes),
    renderedText,
    minimumFontSizeMm: Number.isFinite(minimumFontSizeMm) ? minimumFontSizeMm : 0,
    minimumHorizontalScale: Number.isFinite(minimumHorizontalScale) ? minimumHorizontalScale : 1,
  }
}

function escapeXml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&apos;',
    '"': '&quot;',
  }[character]))
}

function meshToXml(mesh) {
  const vertices = mesh.vertices
    .map(([x, y, z]) => `<vertex x="${x.toFixed(5)}" y="${y.toFixed(5)}" z="${z.toFixed(5)}"/>`)
    .join('')
  const triangles = mesh.triangles
    .map(([v1, v2, v3]) => `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>`)
    .join('')
  return `<mesh><vertices>${vertices}</vertices><triangles>${triangles}</triangles></mesh>`
}

function createColorThreeMf(title, baseBuffer, detailBuffer) {
  const baseMesh = stlToIndexedMesh(baseBuffer)
  const detailMesh = stlToIndexedMesh(detailBuffer)
  const safeTitle = escapeXml(title || 'Recipe card')
  const createdOn = new Date().toISOString().slice(0, 10)
  const bambuStudioVersion = '02.08.01.55'
  const plateCenterX = 128
  const plateCenterY = 128
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
  <metadata name="Application">BambuStudio-${bambuStudioVersion}</metadata>
  <metadata name="BambuStudio:3mfVersion">1</metadata>
  <metadata name="Title">${safeTitle}</metadata>
  <metadata name="Designer">Recipe Table Studio</metadata>
  <metadata name="CreationDate">${createdOn}</metadata>
  <metadata name="ModificationDate">${createdOn}</metadata>
  <resources>
    <object id="3" p:UUID="00000001-7410-4bab-8300-000000000003" type="model">
      <components>
        <component p:path="/3D/Objects/object_1.model" objectid="1" p:UUID="00020000-7410-4bab-8200-000000000001" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
        <component p:path="/3D/Objects/object_1.model" objectid="2" p:UUID="00020001-7410-4bab-8200-000000000002" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
      </components>
    </object>
  </resources>
  <build p:UUID="00000002-7410-4bab-8400-000000000003">
    <item objectid="3" p:UUID="00000003-7410-4bab-8500-000000000003" transform="1 0 0 0 1 0 0 0 1 ${plateCenterX} ${plateCenterY} 0" printable="1"/>
  </build>
</model>`
  const objectModel = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
  <metadata name="BambuStudio:3mfVersion">1</metadata>
  <resources>
    <object id="1" p:UUID="00010000-7410-4bab-8100-000000000001" type="model">${meshToXml(baseMesh)}</object>
    <object id="2" p:UUID="00010001-7410-4bab-8100-000000000002" type="model">${meshToXml(detailMesh)}</object>
  </resources>
  <build/>
</model>`
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`
  const relationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`
  const modelRelationships = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/Objects/object_1.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`
  const modelSettings = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="3">
    <metadata key="name" value="${safeTitle} two-color recipe card"/>
    <metadata key="extruder" value="1"/>
    <metadata face_count="${baseMesh.triangles.length + detailMesh.triangles.length}"/>
    <part id="1" subtype="normal_part" uuid="00030000-7410-4bab-9000-000000000001">
      <metadata key="name" value="${safeTitle} white card"/>
      <metadata key="extruder" value="1"/>
      <mesh_stat face_count="${baseMesh.triangles.length}" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
    <part id="2" subtype="normal_part" uuid="00030001-7410-4bab-9000-000000000002">
      <metadata key="name" value="${safeTitle} black lettering and borders"/>
      <metadata key="extruder" value="2"/>
      <mesh_stat face_count="${detailMesh.triangles.length}" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value="Recipe Table Studio"/>
    <metadata key="locked" value="false"/>
    <metadata key="filament_map_mode" value="Auto For Flush"/>
    <metadata key="filament_maps" value="1 2"/>
    <metadata key="filament_volume_maps" value="1 1"/>
    <model_instance>
      <metadata key="object_id" value="3"/>
      <metadata key="instance_id" value="0"/>
      <metadata key="identify_id" value="30001"/>
    </model_instance>
  </plate>
  <assemble/>
</config>`
  const projectSettings = JSON.stringify({
    bed_exclude_area: ['0x0', '18x0', '18x28', '0x28'],
    curr_bed_type: 'Textured PEI Plate',
    default_filament_colour: ['#FFFFFF', '#000000'],
    default_print_profile: '0.20mm Standard @BBL X1C',
    enable_prime_tower: '1',
    filament_colour: ['#FFFFFF', '#000000'],
    filament_diameter: ['1.75', '1.75'],
    filament_is_support: ['0', '0'],
    filament_map: ['1', '2'],
    filament_map_2: ['1', '2'],
    filament_self_index: ['1', '2'],
    filament_settings_id: [
      'Bambu PLA Basic @BBL P1S 0.4 nozzle',
      'Bambu PLA Basic @BBL P1S 0.4 nozzle',
    ],
    filament_type: ['PLA', 'PLA'],
    filament_vendor: ['Bambu Lab', 'Bambu Lab'],
    initial_layer_print_height: '0.2',
    layer_height: '0.2',
    nozzle_diameter: ['0.4'],
    nozzle_type: 'stainless_steel',
    print_settings_id: '0.20mm Standard @BBL X1C',
    printable_area: ['0x0', '256x0', '256x256', '0x256'],
    printable_height: '250',
    printer_model: 'Bambu Lab P1S',
    printer_settings_id: 'Bambu Lab P1S 0.4 nozzle',
    printer_structure: 'corexy',
    printer_technology: 'FFF',
    printer_variant: '0.4',
    single_extruder_multi_material: '1',
    wall_generator: 'arachne',
  })
  const sliceInfo = `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <header>
    <header_item key="X-BBL-Client-Type" value="slicer"/>
    <header_item key="X-BBL-Client-Version" value="${bambuStudioVersion}"/>
  </header>
</config>`
  const filamentSequence = JSON.stringify({
    plate_1: {
      nozzle_sequence: [],
      optimal_assignment: [],
      sequence: [],
    },
  })

  return zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(relationships),
    '3D/3dmodel.model': strToU8(model),
    '3D/_rels/3dmodel.model.rels': strToU8(modelRelationships),
    '3D/Objects/object_1.model': strToU8(objectModel),
    'Metadata/model_settings.config': strToU8(modelSettings),
    'Metadata/project_settings.config': strToU8(projectSettings),
    'Metadata/slice_info.config': strToU8(sliceInfo),
    'Metadata/filament_sequence.json': strToU8(filamentSequence),
  }, { level: 6 })
}

export function createRecipePrintFiles(recipe, capturedRaster, vectorLibraries = {}) {
  if (!capturedRaster?.raster?.length || !capturedRaster.raster[0]?.length) {
    throw new Error('The recipe table could not be captured.')
  }

  const raster = capturedRaster.raster.map((row) => Uint8Array.from(row))
  resolveDiagonalContacts(raster)
  const columns = raster[0].length
  const rows = raster.length
  const cellMm = STL_CARD.widthMm / columns
  const widthMm = columns * cellMm
  const heightMm = rows * cellMm
  const baseMesh = createBaseMesh(widthMm, heightMm)
  const baseBuffer = indexedMeshToBinaryStl(baseMesh, `${recipe.title} white card`)
  let detailBuffer
  let detailTriangleCount
  let stlBuffer
  let triangleCount
  let renderedText = []
  let vectorText = false
  let minimumFontSizeMm = 0
  let minimumHorizontalScale = 1

  if (vectorLibraries.font && vectorLibraries.TextGeometry && capturedRaster.cells?.length) {
    const borderRaster = (capturedRaster.borderRaster || raster)
      .map((row) => Uint8Array.from(row))
    resolveDiagonalContacts(borderRaster)
    const borderResult = detailRasterToBinaryStl(borderRaster, `${recipe.title} borders`, cellMm)
    const borderMesh = stlToIndexedMesh(borderResult.buffer)
    const vectorResult = createVectorTextMesh(
      {
        cells: capturedRaster.cells,
        columns,
        rows,
      },
      vectorLibraries.font,
      vectorLibraries.TextGeometry,
      cellMm,
    )
    const detailMesh = mergeIndexedMeshes(borderMesh, vectorResult.mesh)
    const combinedMesh = mergeIndexedMeshes(baseMesh, detailMesh)
    detailBuffer = indexedMeshToBinaryStl(detailMesh, `${recipe.title} black details`)
    detailTriangleCount = detailMesh.triangles.length
    stlBuffer = indexedMeshToBinaryStl(combinedMesh, recipe.title)
    triangleCount = combinedMesh.triangles.length
    renderedText = vectorResult.renderedText
    minimumFontSizeMm = vectorResult.minimumFontSizeMm
    minimumHorizontalScale = vectorResult.minimumHorizontalScale
    vectorText = true
  } else {
    const detailResult = detailRasterToBinaryStl(raster, recipe.title, cellMm)
    const stlResult = rasterToBinaryStl(raster, recipe.title, cellMm)
    detailBuffer = detailResult.buffer
    detailTriangleCount = detailResult.triangleCount
    stlBuffer = stlResult.buffer
    triangleCount = stlResult.triangleCount
  }
  const threeMfBuffer = createColorThreeMf(recipe.title, baseBuffer, detailBuffer)

  return {
    baseBuffer,
    detailBuffer,
    stlBuffer,
    threeMfBuffer,
    metadata: {
      widthMm,
      heightMm,
      depthMm: STL_CARD.baseHeightMm + STL_CARD.reliefHeightMm,
      triangleCount,
      detailTriangleCount,
      colorCount: 2,
      renderedText,
      vectorText,
      minimumFontSizeMm,
      minimumHorizontalScale,
    },
  }
}

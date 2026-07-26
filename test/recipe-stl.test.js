import test from 'node:test'
import assert from 'node:assert/strict'
import { strFromU8, unzipSync } from 'fflate'

import { createRecipePrintFiles, createRecipeStl, STL_CARD } from '../src/recipe-stl.js'

const recipe = {
  title: 'Test Cake',
  note: 'Bake at 350 degrees',
  ingredients: '1 cup flour\n2 eggs',
  actions: [
    { text: 'Mix together' },
    { text: 'Bake 30 minutes' },
  ],
}

test('creates a correctly sized binary STL for a recipe card', () => {
  const { buffer, metadata } = createRecipeStl(recipe)
  const view = new DataView(buffer)
  const triangleCount = view.getUint32(80, true)

  assert.equal(triangleCount, metadata.triangleCount)
  assert.equal(buffer.byteLength, 84 + triangleCount * 50)
  assert.equal(metadata.widthMm, STL_CARD.widthMm)
  assert.equal(metadata.heightMm, STL_CARD.minimumRows * STL_CARD.cellMm)
  assert.equal(metadata.depthMm, STL_CARD.baseHeightMm + STL_CARD.reliefHeightMm)
  assert.equal(metadata.ingredientCount, 2)
  assert.equal(metadata.actionCount, 2)
})

test('writes finite, non-degenerate triangle geometry', () => {
  const { buffer } = createRecipeStl(recipe)
  const view = new DataView(buffer)
  const triangleCount = view.getUint32(80, true)

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = 84 + triangle * 50
    const vertices = Array.from({ length: 9 }, (_, index) => view.getFloat32(offset + 12 + index * 4, true))
    assert.ok(vertices.every(Number.isFinite))

    const [ax, ay, az, bx, by, bz, cx, cy, cz] = vertices
    const ab = [bx - ax, by - ay, bz - az]
    const ac = [cx - ax, cy - ay, cz - az]
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ]
    assert.ok(Math.hypot(...cross) > 0)
  }
})

test('creates a closed mesh where every edge belongs to two triangles', () => {
  const { buffer } = createRecipeStl(recipe)
  const view = new DataView(buffer)
  const triangleCount = view.getUint32(80, true)
  const edgeCounts = new Map()

  function vertexKey(offset) {
    return [0, 1, 2]
      .map((axis) => {
        const value = view.getFloat32(offset + axis * 4, true)
        return (Math.abs(value) < 0.00005 ? 0 : value).toFixed(4)
      })
      .join(',')
  }

  function countEdge(a, b) {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`
    edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1)
  }

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const offset = 84 + triangle * 50 + 12
    const vertices = [vertexKey(offset), vertexKey(offset + 12), vertexKey(offset + 24)]
    countEdge(vertices[0], vertices[1])
    countEdge(vertices[1], vertices[2])
    countEdge(vertices[2], vertices[0])
  }

  assert.equal([...edgeCounts.values()].filter((count) => count !== 2).length, 0)
})

test('creates a two-color 3MF and STL from a captured table raster', () => {
  const raster = Array.from({ length: 8 }, (_, y) => Uint8Array.from(
    Array.from({ length: 12 }, (_, x) => (
      x === 0 || x === 11 || y === 0 || y === 7 || x === 5 || y === 3 ? 1 : 0
    )),
  ))
  const result = createRecipePrintFiles(recipe, { raster })
  const archive = unzipSync(result.threeMfBuffer)
  const model = strFromU8(archive['3D/3dmodel.model'])

  assert.equal(result.metadata.widthMm, 180)
  assert.equal(result.metadata.heightMm, 120)
  assert.equal(result.metadata.colorCount, 2)
  assert.ok(result.baseBuffer.byteLength > 84)
  assert.ok(result.detailBuffer.byteLength > 84)
  assert.ok(result.stlBuffer.byteLength > 84)
  assert.match(model, /White card/)
  assert.match(model, /Black lettering and borders/)
  assert.match(model, /displaycolor="#FFFFFFFF"/)
  assert.match(model, /displaycolor="#000000FF"/)
  assert.match(model, /<component objectid="2"\/>/)
  assert.match(model, /<component objectid="3"\/>/)
  assert.match(model, /<item objectid="4"\/>/)
})

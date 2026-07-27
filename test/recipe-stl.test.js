import test from 'node:test'
import assert from 'node:assert/strict'
import { strFromU8, unzipSync } from 'fflate'
import helvetiker from 'three.regular.helvetiker'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

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
  const objectModel = strFromU8(archive['3D/Objects/object_1.model'])
  const projectSettings = JSON.parse(strFromU8(archive['Metadata/project_settings.config']))
  const modelSettings = strFromU8(archive['Metadata/model_settings.config'])

  assert.equal(result.metadata.widthMm, STL_CARD.widthMm)
  assert.equal(result.metadata.heightMm, 8 * (STL_CARD.widthMm / 12))
  assert.equal(result.metadata.colorCount, 2)
  assert.ok(result.baseBuffer.byteLength > 84)
  assert.ok(result.detailBuffer.byteLength > 84)
  assert.ok(result.stlBuffer.byteLength > 84)
  assert.match(objectModel, /<object id="1"[^>]*>/)
  assert.match(objectModel, /<object id="2"[^>]*>/)
  assert.match(model, /<component [^>]*objectid="1"[^>]*\/>/)
  assert.match(model, /<component [^>]*objectid="2"[^>]*\/>/)
  assert.match(model, /<item objectid="3"[^>]*\/>/)
  assert.match(model, /<metadata name="Application">BambuStudio-02\.08\.01\.55<\/metadata>/)
  assert.match(model, /BambuStudio:3mfVersion/)
  assert.match(modelSettings, /<part id="1"[\s\S]*?<metadata key="extruder" value="1"\/>/)
  assert.match(modelSettings, /<part id="2"[\s\S]*?<metadata key="extruder" value="2"\/>/)
  assert.match(modelSettings, /<metadata key="filament_maps" value="1 2"\/>/)
  assert.match(modelSettings, /<metadata key="filament_volume_maps" value="1 1"\/>/)
  assert.match(modelSettings, /<model_instance>[\s\S]*?<metadata key="object_id" value="3"\/>[\s\S]*?<\/model_instance>/)
  assert.equal(projectSettings.printer_model, 'Bambu Lab P1S')
  assert.equal(projectSettings.printer_variant, '0.4')
  assert.equal(projectSettings.printer_settings_id, 'Bambu Lab P1S 0.4 nozzle')
  assert.equal(projectSettings.print_settings_id, '0.20mm Standard @BBL X1C')
  assert.equal(projectSettings.layer_height, '0.2')
  assert.equal(projectSettings.initial_layer_print_height, '0.2')
  assert.deepEqual(projectSettings.printable_area, ['0x0', '256x0', '256x256', '0x256'])
  assert.deepEqual(projectSettings.filament_colour, ['#FFFFFF', '#000000'])
  assert.deepEqual(projectSettings.filament_is_support, ['0', '0'])
  assert.equal(projectSettings.wall_generator, 'arachne')
})

test('places the recipe card fully inside a 256 mm Bambu build plate', () => {
  const raster = Array.from({ length: 8 }, (_, y) => Uint8Array.from(
    Array.from({ length: 12 }, (_, x) => (
      x === 0 || x === 11 || y === 0 || y === 7 || x === 5 || y === 3 ? 1 : 0
    )),
  ))
  const result = createRecipePrintFiles(recipe, { raster })
  const archive = unzipSync(result.threeMfBuffer)
  const model = strFromU8(archive['3D/3dmodel.model'])
  const objectModel = strFromU8(archive['3D/Objects/object_1.model'])
  const transform = model.match(/<item[^>]*transform="([^"]+)"/)?.[1]
    .split(/\s+/)
    .map(Number)
  const vertices = [...objectModel.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)]
    .map((match) => match.slice(1).map(Number))

  assert.ok(transform)
  assert.ok(vertices.length > 0)

  const translatedX = vertices.map(([x]) => x + transform[9])
  const translatedY = vertices.map(([, y]) => y + transform[10])

  assert.ok(Math.min(...translatedX) >= 0)
  assert.ok(Math.max(...translatedX) <= 256)
  assert.ok(Math.min(...translatedY) >= 0)
  assert.ok(Math.max(...translatedY) <= 256)
})

test('keeps raised lettering and borders to a low 0.4 mm relief', () => {
  const raster = Array.from({ length: 8 }, (_, y) => Uint8Array.from(
    Array.from({ length: 12 }, (_, x) => (
      x === 0 || x === 11 || y === 0 || y === 7 || x === 5 || y === 3 ? 1 : 0
    )),
  ))
  const result = createRecipePrintFiles(recipe, { raster })
  const archive = unzipSync(result.threeMfBuffer)
  const objectModel = strFromU8(archive['3D/Objects/object_1.model'])
  const detail = objectModel.match(/<object id="2"[^>]*>([\s\S]*?)<\/object>/)?.[1]
  const zCoordinates = [...detail.matchAll(/<vertex x="[^"]+" y="[^"]+" z="([^"]+)"\/>/g)]
    .map((match) => Number(match[1]))

  assert.ok(Math.abs((Math.max(...zCoordinates) - Math.min(...zCoordinates)) - 0.4) < 0.00001)
})

test('uses vector geometry for every captured table label', () => {
  const raster = Array.from({ length: 40 }, (_, y) => Uint8Array.from(
    Array.from({ length: 80 }, (_, x) => (
      x === 0 || x === 79 || y === 0 || y === 39 ? 1 : 0
    )),
  ))
  const cells = [
    { text: 'Test Cake', x: 0, y: 0, width: 80, height: 12, role: 'title' },
    { text: '2 teaspoons baking powder', x: 0, y: 12, width: 34, height: 14, role: 'body' },
    { text: 'Mix until just combined', x: 34, y: 12, width: 46, height: 28, role: 'body' },
  ]
  const font = new FontLoader().parse(helvetiker)
  const result = createRecipePrintFiles(
    recipe,
    { raster, borderRaster: raster, cells },
    { font, TextGeometry },
  )

  assert.equal(result.metadata.vectorText, true)
  assert.deepEqual(result.metadata.renderedText, cells.map(({ text }) => text))
  assert.ok(result.metadata.minimumFontSizeMm >= 3.1)
  assert.ok(result.metadata.minimumHorizontalScale >= 0.76)
  assert.ok(result.metadata.detailTriangleCount > 100)
})

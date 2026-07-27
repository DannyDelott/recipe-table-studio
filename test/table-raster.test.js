import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PRINT_RASTER,
} from '../src/table-raster.js'

test('3D table typography meets minimum printable dimensions', () => {
  assert.equal(PRINT_RASTER.cardWidthMm, 220)
  assert.ok(PRINT_RASTER.cellMm <= 0.31)
  assert.ok(PRINT_RASTER.minimumTextHeightMm >= 3)
  assert.ok(PRINT_RASTER.minimumFontWeight >= 700)
  assert.ok(PRINT_RASTER.detailStrokeMm >= 0.8)
})

test('the finer raster preserves printable detail without expanding letterforms', () => {
  assert.equal(PRINT_RASTER.columns, 720)
  assert.equal(PRINT_RASTER.cellMm, PRINT_RASTER.cardWidthMm / PRINT_RASTER.columns)
})

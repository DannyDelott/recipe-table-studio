import opentype from 'opentype.js'

// Adapted from Three.js TTFLoader's typeface conversion. The source font is
// parsed in the browser so Vite can bundle the licensed font asset directly.
export function openTypeToThreeFontJson(font) {
  const glyphs = {}
  const scale = 100000 / ((font.unitsPerEm || 2048) * 72)
  const round = Math.round
  const glyphIndexMap = font.encoding.cmap.glyphIndexMap

  Object.keys(glyphIndexMap).forEach((unicode) => {
    const glyph = font.glyphs.glyphs[glyphIndexMap[unicode]]
    if (!glyph) return

    const token = {
      ha: round(glyph.advanceWidth * scale),
      x_min: round(glyph.xMin * scale),
      x_max: round(glyph.xMax * scale),
      o: '',
    }

    glyph.path.commands.forEach((pathCommand) => {
      const command = pathCommand.type.toLowerCase() === 'c'
        ? { ...pathCommand, type: 'b' }
        : pathCommand
      token.o += `${command.type.toLowerCase()} `

      if (command.x !== undefined && command.y !== undefined) {
        token.o += `${round(command.x * scale)} ${round(command.y * scale)} `
      }
      if (command.x1 !== undefined && command.y1 !== undefined) {
        token.o += `${round(command.x1 * scale)} ${round(command.y1 * scale)} `
      }
      if (command.x2 !== undefined && command.y2 !== undefined) {
        token.o += `${round(command.x2 * scale)} ${round(command.y2 * scale)} `
      }
    })

    const unicodes = glyph.unicodes?.length ? glyph.unicodes : [glyph.unicode]
    unicodes.filter(Number.isFinite).forEach((codePoint) => {
      glyphs[String.fromCodePoint(codePoint)] = token
    })
  })

  return {
    glyphs,
    familyName: font.getEnglishName('fullName'),
    ascender: round(font.ascender * scale),
    descender: round(font.descender * scale),
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: {
      xMin: font.tables.head.xMin,
      xMax: font.tables.head.xMax,
      yMin: font.tables.head.yMin,
      yMax: font.tables.head.yMax,
    },
    resolution: 1000,
    original_font_information: font.tables.name,
  }
}

export async function loadOpenTypeAsThreeFontJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('The printable typeface could not be loaded.')
  const font = opentype.parse(await response.arrayBuffer())
  return openTypeToThreeFontJson(font)
}

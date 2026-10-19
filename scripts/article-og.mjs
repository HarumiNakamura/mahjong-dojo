// 記事ごとの OGP 画像(1200×630 の PNG)を作る。scripts/prerender.mjs から使う
//
// ブラウザを使わずに作る: 題名はフォント(@fontsource の Shippori Mincho B1。SIL OFL)から文字の形(パス)に変換し、
// 牌はサイトの牌の絵(SVG)をそのまま使って SVG を組み立て、@resvg/resvg-wasm で PNG にする。

import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'
import { initWasm, Resvg } from '@resvg/resvg-wasm'

const W = 1200
const H = 630
const FONT_PKG = 'shippori-mincho-b1'
const FONT_WEIGHT = 800

const COLORS = { bg: '#f6f2e8', band: '#2f6b55', text: '#1d2b26', muted: '#5b6568', chip: '#e3efe9' }

function loadFaces(root) {
  const dir = path.join(root, 'node_modules/@fontsource', FONT_PKG)
  const css = fs.readFileSync(path.join(dir, `${FONT_WEIGHT}.css`), 'utf8')
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => ({
    file: path.join(dir, 'files', m[1].match(/url\(\.\/files\/([^)]+\.woff)\)/)[1]),
    ranges: (m[1].match(/unicode-range:\s*([^;]+);/)?.[1] ?? '').split(',').map((r) => r.trim().replace('U+', '')),
  }))
}

const inRange = (cp, range) => {
  const [a, b] = range.split('-').map((x) => parseInt(x, 16))
  return b === undefined ? cp === a : cp >= a && cp <= b
}

/** 文字列を、文字ごとに合うフォントのパスにする。幅も返す */
function makeText(faces, cache) {
  const fontFor = (ch) => {
    const face = faces.find((f) => f.ranges.some((r) => inRange(ch.codePointAt(0), r)))
    if (!face) return null
    if (!cache.has(face.file)) {
      const buf = fs.readFileSync(face.file)
      cache.set(face.file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
    }
    return cache.get(face.file)
  }
  const width = (text, size) => [...text].reduce((w, ch) => w + (fontFor(ch)?.getAdvanceWidth(ch, size) ?? size * 0.5), 0)
  const draw = (text, x, y, size, fill) => {
    let cx = x
    const parts = []
    for (const ch of text) {
      const font = fontFor(ch)
      if (!font) {
        cx += size * 0.5
        continue
      }
      parts.push(font.getPath(ch, cx, y, size).toPathData(1))
      cx += font.getAdvanceWidth(ch, size)
    }
    return `<path fill="${fill}" d="${parts.join(' ')}"/>`
  }
  return { width, draw }
}

/** 題名を、幅に収まるように行に分ける(区切りの記号のあとで折り返しやすくする) */
function wrap(text, maxWidth, size, width) {
  const lines = []
  let line = ''
  for (const ch of text) {
    if (line && width(line + ch, size) > maxWidth) {
      lines.push(line)
      line = ''
    }
    line += ch
  }
  if (line) lines.push(line)
  return lines
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export async function buildArticleOgImages({ root, outDir, siteName, articles, tileArt }) {
  await initWasm(fs.readFileSync(path.join(root, 'node_modules/@resvg/resvg-wasm/index_bg.wasm')))
  const text = makeText(loadFaces(root), new Map())
  fs.mkdirSync(outDir, { recursive: true })
  for (const a of articles) {
    // 題名(大きく。2行まで入るように大きさを決める)
    let size = 76
    let lines = wrap(a.title, W - 160, size, text.width)
    while (lines.length > 2 && size > 48) {
      size -= 6
      lines = wrap(a.title, W - 160, size, text.width)
    }
    const titleY = 230
    const title = lines.map((l, i) => text.draw(l, 80, titleY + i * size * 1.3, size, COLORS.text)).join('')
    // 牌(下に一列。最大14枚)
    const tiles = tileArt(a.tiles).slice(0, 14)
    const tw = Math.min(70, (W - 160) / Math.max(tiles.length, 1))
    const th = (tw * 80) / 60
    const tx0 = (W - tw * tiles.length) / 2
    const tileSvg = tiles
      .map((inner, i) => `<svg x="${tx0 + i * tw}" y="${H - th - 110}" width="${tw}" height="${th}" viewBox="0 0 60 80">${inner}</svg>`)
      .join('')
    const chipW = text.width(a.category, 28) + 40
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>
<rect width="${W}" height="16" fill="${COLORS.band}"/>
<rect x="80" y="70" width="${chipW}" height="48" rx="24" fill="${COLORS.chip}"/>
${text.draw(a.category, 100, 104, 28, COLORS.band)}
${title}
${tileSvg}
<rect y="${H - 70}" width="${W}" height="70" fill="${COLORS.band}"/>
${text.draw(siteName, 80, H - 24, 30, '#ffffff')}
${text.draw('解説', W - 80 - text.width('解説', 26), H - 26, 26, '#ffffff')}
</svg>`
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()
    fs.writeFileSync(path.join(outDir, `${a.slug}.png`), png)
  }
  return articles.length
}

export { escape }

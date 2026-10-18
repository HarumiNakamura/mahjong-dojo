// 牌の文字(漢数字・萬・東南西北・發・中)を、フォントから SVG のパスに変換して
// src/components/tile/glyphs.generated.ts に書き出す。
// 使うフォントは npm の @fontsource から取得する(すべて SIL Open Font License 1.1)。
// 実行: npm run build:glyphs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/components/tile/glyphs.generated.ts')

/** 必要な文字 */
const CHARS = '一二三四五六七八九萬東南西北發中'

/** 使うフォント(id: [パッケージ名, 太さ]) */
const FONTS = {
  shipporiMinchoB1: ['shippori-mincho-b1', 800],
}

/** 1文字の大きさを 100 とした座標で書き出す */
const EM = 100

function loadFaces(pkg, weight) {
  const dir = path.join(ROOT, 'node_modules/@fontsource', pkg)
  const css = fs.readFileSync(path.join(dir, `${weight}.css`), 'utf8')
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => ({
    file: path.join(dir, 'files', m[1].match(/url\(\.\/files\/([^)]+\.woff)\)/)[1]),
    ranges: (m[1].match(/unicode-range:\s*([^;]+);/)?.[1] ?? '').split(',').map((r) => r.trim().replace('U+', '')),
  }))
}

function inRange(cp, range) {
  const [a, b] = range.split('-').map((x) => parseInt(x, 16))
  return b === undefined ? cp === a : cp >= a && cp <= b
}

const fontCache = new Map()
function loadFont(file) {
  if (!fontCache.has(file)) {
    const buf = fs.readFileSync(file)
    fontCache.set(file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
  }
  return fontCache.get(file)
}

const round = (n) => Math.round(n * 10) / 10

let out = `// このファイルは scripts/build-tile-glyphs.mjs で自動生成しています。直接編集しないでください。
// フォントのライセンスは docs/licenses.md を参照。

export interface Glyph {
  /** SVG のパス(1文字の大きさ = ${EM}) */
  d: string
  /** 文字の外枠(左上 x, y と幅 w, 高さ h) */
  x: number
  y: number
  w: number
  h: number
}

export type GlyphChar = ${[...CHARS].map((c) => `'${c}'`).join(' | ')}

`
for (const [id, [pkg, weight]] of Object.entries(FONTS)) {
  const faces = loadFaces(pkg, weight)
  out += `/** @fontsource/${pkg}(太さ ${weight}) */\nexport const ${id}: Record<GlyphChar, Glyph> = {\n`
  for (const ch of CHARS) {
    const face = faces.find((f) => f.ranges.some((r) => inRange(ch.codePointAt(0), r)))
    if (!face) throw new Error(`${pkg} に ${ch} がありません`)
    const glyph = loadFont(face.file).charToGlyph(ch)
    if (!glyph || glyph.index === 0) throw new Error(`${pkg} に ${ch} がありません`)
    const p = glyph.getPath(0, EM * 0.88, EM)
    const box = p.getBoundingBox()
    out += `  '${ch}': { d: '${p.toPathData(1)}', x: ${round(box.x1)}, y: ${round(box.y1)}, w: ${round(box.x2 - box.x1)}, h: ${round(box.y2 - box.y1)} },\n`
  }
  out += '}\n\n'
}
fs.writeFileSync(OUT, out.trimEnd() + '\n')
console.log(`書き出しました: ${path.relative(ROOT, OUT)} (${(out.length / 1024).toFixed(1)} KB)`)

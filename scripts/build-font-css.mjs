// サイトで使う文字だけの @font-face を作る(src/fonts.generated.css)
//
// @fontsource の日本語フォントは、文字の範囲ごとに約120個のファイルに分かれていて、CSS の @font-face も
// 約120個ある(3書体で約180KB)。サイトのソース(画面・記事・用語)に出てくる文字を調べ、
// それを含むファイルの @font-face だけを、使う文字だけの unicode-range にして書き出す。
// font-display は optional(読み込みが遅いときは端末のフォントのまま表示し、文字の入れ替えで表示がずれない)。
// 画面や記事の文字を増やしたら、npm run build:fonts で作り直す(npm run build でも先に実行する)。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/fonts.generated.css')

/** 使うフォント(パッケージ・太さ) */
const FONTS = [
  ['biz-udpgothic', 400],
  ['biz-udpgothic', 700],
  ['shippori-mincho-b1', 800],
]

/** サイトのソースに出てくる文字 + ASCII・かな・よく使う記号(入力や数字の表示のため) */
function usedCodePoints() {
  const set = new Set()
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(tsx?|md|css)$/.test(e.name) && !e.name.endsWith('.generated.ts') && !e.name.endsWith('.generated.css')) {
        for (const ch of fs.readFileSync(p, 'utf8')) set.add(ch.codePointAt(0))
      }
    }
  }
  walk(path.join(ROOT, 'src'))
  for (const ch of fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) set.add(ch.codePointAt(0))
  const add = (a, b) => {
    for (let c = a; c <= b; c++) set.add(c)
  }
  add(0x20, 0x7e) // ASCII
  add(0x3000, 0x30ff) // 和文の記号・ひらがな・カタカナ
  add(0xff01, 0xff5e) // 全角の英数・記号
  return set
}

function parseRange(text) {
  return text.split(',').flatMap((r) => {
    const [a, b] = r.trim().replace(/^U\+/i, '').split('-').map((x) => parseInt(x, 16))
    return [[a, b ?? a]]
  })
}

/** 文字の番号の一覧を、U+xx-yy の形にまとめる */
function formatRange(codes) {
  const sorted = [...codes].sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < sorted.length; ) {
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++
    const h = (n) => n.toString(16)
    out.push(j > i ? `U+${h(sorted[i])}-${h(sorted[j])}` : `U+${h(sorted[i])}`)
    i = j + 1
  }
  return out.join(',')
}

const used = usedCodePoints()
let css = `/* このファイルは scripts/build-font-css.mjs で自動生成しています。直接編集しないでください(npm run build:fonts) */\n`
let faces = 0
for (const [pkg, weight] of FONTS) {
  const dir = `node_modules/@fontsource/${pkg}`
  const src = fs.readFileSync(path.join(ROOT, dir, `${weight}.css`), 'utf8')
  for (const m of src.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const body = m[1]
    const ranges = parseRange(body.match(/unicode-range:\s*([^;]+);/)[1])
    const codes = [...used].filter((c) => ranges.some(([a, b]) => c >= a && c <= b))
    if (codes.length === 0) continue
    const file = body.match(/url\(\.\/files\/([^)]+\.woff2)\)/)[1]
    const family = body.match(/font-family:\s*([^;]+);/)[1]
    css += `@font-face{font-family:${family};font-style:normal;font-display:optional;font-weight:${weight};src:url(../${dir}/files/${file}) format('woff2');unicode-range:${formatRange(codes)}}\n`
    faces++
  }
}
fs.writeFileSync(OUT, css)
console.log(`fonts: ${faces}個の @font-face(${used.size}文字)を src/fonts.generated.css に書き出しました(${Math.round(css.length / 1024)}KB)`)

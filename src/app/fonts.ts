// サイトのフォント(本文: BIZ UDPゴシック、見出し: しっぽり明朝 B1。どちらも SIL OFL)の読み込み
//
// フォントの @font-face は、サイトで使う文字だけを含む src/fonts.generated.css(scripts/build-font-css.mjs)。
// - はじめて開いたとき: フォントの CSS は当てない(当てると、ファイルが届くたびにページ全体の配置をやり直して重くなる)。
//   ブラウザが空いたときに、そのページで使うフォントのファイルだけを読み込んでおく(キャッシュに入る)
// - 2回目から: ページを開いてすぐフォントの CSS を当てる(ファイルはキャッシュにあるので、すぐ表示できる)

export interface FontFaceInfo {
  family: string
  weight: string
  url: string
  /** unicode-range の範囲 [最初, 最後] */
  ranges: [number, number][]
  /** unicode-range の元の文字列(FontFace に渡す) */
  unicodeRange: string
}

/** @font-face の CSS を読む */
export function parseFontFaces(css: string): FontFaceInfo[] {
  const faces: FontFaceInfo[] = []
  for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = m[1]
    const family = body.match(/font-family:\s*['"]?([^;'"]+)['"]?/)?.[1]?.trim()
    const weight = body.match(/font-weight:\s*(\d+)/)?.[1]
    const url = body.match(/src:\s*url\(([^)]+)\)/)?.[1]?.replace(/^["']|["']$/g, '')
    const unicodeRange = body.match(/unicode-range:\s*([^;}]+)/)?.[1]?.trim()
    if (!family || !weight || !url || !unicodeRange) continue
    const ranges = unicodeRange.split(',').map((r): [number, number] => {
      const [a, b] = r.trim().replace(/^U\+/i, '').split('-')
      return [parseInt(a, 16), parseInt(b ?? a, 16)]
    })
    faces.push({ family, weight, url, ranges, unicodeRange })
  }
  return faces
}

/** 文字列の文字を含む @font-face だけを選ぶ */
export function facesForText(faces: readonly FontFaceInfo[], text: string): FontFaceInfo[] {
  const codes = new Set<number>()
  for (const ch of text) codes.add(ch.codePointAt(0)!)
  return faces.filter((f) => [...codes].some((c) => f.ranges.some(([a, b]) => c >= a && c <= b)))
}

const CACHED_KEY = 'mahjong-dojo:fonts-cached'
/** ページの読み込みが終わってから、フォントのファイルを読み込み始めるまで */
const WARM_DELAY_MS = 3000

const loadCss = () => import('../fonts.generated.css?inline').then((m) => m.default as string)

function readCached(): boolean {
  try {
    return window.localStorage.getItem(CACHED_KEY) === '1'
  } catch {
    return false
  }
}

/** フォントの CSS を当てる(2回目から) */
async function applyFonts() {
  const style = document.createElement('style')
  style.textContent = await loadCss()
  document.head.append(style)
}

/** そのページで使うフォントのファイルを読み込んでおく(CSS は当てないので、ページの配置は変わらない) */
async function warmFonts() {
  if (typeof FontFace === 'undefined') return
  const faces = facesForText(parseFontFaces(await loadCss()), document.body.innerText)
  const results = await Promise.all(
    faces.map((f) =>
      new FontFace(f.family, `url(${f.url}) format('woff2')`, { weight: f.weight, unicodeRange: f.unicodeRange }).load().then(
        () => true,
        () => false,
      ),
    ),
  )
  if (results.every(Boolean)) {
    try {
      window.localStorage.setItem(CACHED_KEY, '1')
    } catch {
      // 保存できなければ、次も端末のフォントで表示するだけ
    }
  }
}

/** ページを開いたときに呼ぶ */
export function startFonts() {
  if (readCached()) {
    void applyFonts()
    return
  }
  // 画面の表示(一番大きな部分の描画)が終わってから、ブラウザが空いているときに読み込む
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 10000 }) : fn())
  const start = () => setTimeout(() => idle(() => void warmFonts()), WARM_DELAY_MS)
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}

// 解説記事用の小さな Markdown の読み取り(ライブラリを使わない・純粋な関数)
//
// 使える書き方:
//   先頭の --- で囲んだ部分 … 記事の情報(title・seoTitle・description・order・category・drills・related)
//   ## 見出し / ### 小見出し
//   空行で区切った段落、- の箇条書き、1. の番号付き箇条書き、> の補足(注意書き)
//   | 表 | の行(2行目は |---| の区切り)
//   **太字**、[文字](/パス) のリンク、[[123m]] で文中に牌を表示
//   @tiles 123m456p789s1122z 説明文   … 手牌の図(説明文は省略可)
//   @drill /practice/waits           … ドリルへの案内を埋め込む
//   {{面子}} / {{めんつ|面子}}          … 用語(用語部品 Term。| の右は src/content/terms.ts の用語・別名・id)
//   @glossary                        … 用語集(src/content/terms.ts の全用語)
//   @figure table-overview           … 図解(src/content/figures.ts の図。代替テキストもそこに書く)
//   @points の次の行から - の箇条書き   … 「この記事でわかること」の囲み(記事の冒頭に3行)

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'tiles'; tiles: string }
  | { type: 'term'; key: string; text: string }

export type Block =
  | { type: 'heading'; level: 2 | 3; text: string; id: string }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'note'; children: Inline[] }
  | { type: 'table'; header: Inline[][]; rows: Inline[][][] }
  | { type: 'tiles'; tiles: string; caption: string }
  | { type: 'drill'; path: string }
  | { type: 'glossary' }
  | { type: 'figure'; id: string }
  | { type: 'points'; items: Inline[][] }

export interface ArticleMeta {
  /** 記事の見出し(h1) */
  title: string
  /** 検索結果・ブラウザのタブに出す題名(検索されやすい言葉を含む30字前後。なければ title) */
  seoTitle?: string
  description: string
  order: number
  /** 一覧で分ける分類(例: 基本・牌効率・守備) */
  category: string
  /** 記事の最後に出すドリル(パス) */
  drills: string[]
  /** 関連記事(slug) */
  related: string[]
}

export interface ParsedArticle {
  meta: ArticleMeta
  blocks: Block[]
}

/** 文中の書き方(太字・リンク・牌)を読む */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let buf = ''
  const flush = () => {
    if (buf) out.push({ type: 'text', text: buf })
    buf = ''
  }
  let i = 0
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end > i) {
        flush()
        out.push({ type: 'strong', children: parseInline(text.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }
    if (text.startsWith('{{', i)) {
      const end = text.indexOf('}}', i + 2)
      if (end > i) {
        flush()
        const [shown, key] = text.slice(i + 2, end).split('|')
        out.push({ type: 'term', key: (key ?? shown).trim(), text: shown.trim() })
        i = end + 2
        continue
      }
    }
    if (text.startsWith('[[', i)) {
      const end = text.indexOf(']]', i + 2)
      if (end > i) {
        flush()
        out.push({ type: 'tiles', tiles: text.slice(i + 2, end).trim() })
        i = end + 2
        continue
      }
    }
    if (text[i] === '[') {
      const close = text.indexOf('](', i)
      const end = close > i ? text.indexOf(')', close) : -1
      if (close > i && end > close) {
        flush()
        out.push({ type: 'link', href: text.slice(close + 2, end), children: parseInline(text.slice(i + 1, close)) })
        i = end + 1
        continue
      }
    }
    buf += text[i]
    i++
  }
  flush()
  return out
}

function parseMeta(lines: string[]): ArticleMeta {
  const map = new Map<string, string>()
  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) map.set(m[1], m[2].trim())
  }
  const list = (key: string) =>
    (map.get(key) ?? '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  const title = map.get('title')
  if (!title) throw new Error('記事に title がありません')
  return {
    title,
    ...(map.get('seoTitle') ? { seoTitle: map.get('seoTitle') } : {}),
    description: map.get('description') ?? '',
    order: Number(map.get('order') ?? 999),
    category: map.get('category') ?? 'その他',
    drills: list('drills'),
    related: list('related'),
  }
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => parseInline(c.trim()))

export function parseArticle(source: string): ParsedArticle {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let start = 0
  let meta: ArticleMeta | null = null
  if (lines[0]?.trim() === '---') {
    const end = lines.indexOf('---', 1)
    if (end < 0) throw new Error('記事の情報(---)が閉じていません')
    meta = parseMeta(lines.slice(1, end))
    start = end + 1
  }
  if (!meta) throw new Error('記事の情報(---)がありません')

  const blocks: Block[] = []
  let headingCount = 0
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (t === '') {
      i++
      continue
    }
    const h = t.match(/^(#{2,3})\s+(.*)$/)
    if (h) {
      headingCount++
      blocks.push({ type: 'heading', level: h[1].length as 2 | 3, text: h[2], id: `s${headingCount}` })
      i++
      continue
    }
    if (t.startsWith('@tiles ')) {
      const [tiles, ...caption] = t.slice(7).trim().split(/\s+/)
      blocks.push({ type: 'tiles', tiles, caption: caption.join(' ') })
      i++
      continue
    }
    if (t.startsWith('@drill ')) {
      blocks.push({ type: 'drill', path: t.slice(7).trim() })
      i++
      continue
    }
    if (t.startsWith('@figure ')) {
      blocks.push({ type: 'figure', id: t.slice(8).trim() })
      i++
      continue
    }
    if (t === '@points') {
      const items: Inline[][] = []
      i++
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) items.push(parseInline(lines[i++].trim().replace(/^-\s+/, '')))
      blocks.push({ type: 'points', items })
      continue
    }
    if (t === '@glossary') {
      blocks.push({ type: 'glossary' })
      i++
      continue
    }
    if (t.startsWith('|')) {
      const rows: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++])
      const body = rows.filter((r, n) => !(n === 1 && /^\|?\s*:?-{2,}/.test(r.trim())))
      blocks.push({ type: 'table', header: cells(body[0]), rows: body.slice(1).map(cells) })
      continue
    }
    if (/^(-|\d+\.)\s+/.test(t)) {
      const ordered = /^\d+\./.test(t)
      const items: Inline[][] = []
      while (i < lines.length && /^(-|\d+\.)\s+/.test(lines[i].trim())) {
        items.push(parseInline(lines[i].trim().replace(/^(-|\d+\.)\s+/, '')))
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }
    if (t.startsWith('>')) {
      const parts: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) parts.push(lines[i++].trim().replace(/^>\s?/, ''))
      blocks.push({ type: 'note', children: parseInline(parts.join('')) })
      continue
    }
    const parts: string[] = []
    while (i < lines.length) {
      const l = lines[i].trim()
      if (l === '' || /^(#{2,3}\s|@tiles |@drill |@figure |@points$|@glossary$|\||-\s|\d+\.\s|>)/.test(l)) break
      parts.push(l)
      i++
    }
    blocks.push({ type: 'paragraph', children: parseInline(parts.join('')) })
  }
  return { meta, blocks }
}

/** 文字だけを取り出す(文字数を数える・説明文に使う) */
export function inlineText(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => (n.type === 'text' || n.type === 'term' ? n.text : n.type === 'tiles' ? n.tiles : inlineText(n.children)))
    .join('')
}

/** 本文の文字数(見出し・段落・箇条書き・表・補足・図の説明。空白は数えない)。figureText は図解の代替テキストを返す */
export function articleLength(blocks: readonly Block[], figureText: (id: string) => string = () => ''): number {
  let text = ''
  for (const b of blocks) {
    if (b.type === 'heading') text += b.text
    else if (b.type === 'paragraph' || b.type === 'note') text += inlineText(b.children)
    else if (b.type === 'list' || b.type === 'points') text += b.items.map(inlineText).join('')
    else if (b.type === 'figure') text += figureText(b.id)
    else if (b.type === 'table') text += [b.header, ...b.rows].flat().map((c) => inlineText(c)).join('')
    else if (b.type === 'tiles') text += b.caption
  }
  return text.replace(/\s/g, '').length
}

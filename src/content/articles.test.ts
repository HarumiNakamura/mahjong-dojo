import { describe, expect, it } from 'vitest'
import { findPageInfo, NAV_ITEMS } from '../app/routes'
import { checkTileSet, parseTiles } from '../engine/tiles'
import { ARTICLES } from './articles'
import { findTerm } from './terms'
import { FIGURES } from './figures'
import { articleLength, parseArticle, parseInline, type Block, type Inline } from './markdown'

describe('Markdown の読み取り', () => {
  it('見出し・段落・箇条書き・表・補足・牌・ドリルを読める', () => {
    const a = parseArticle(
      [
        '---',
        'title: テスト',
        'description: 説明',
        'order: 5',
        'category: 基本',
        'drills: /practice/waits, /practice/efficiency',
        'related: a, b',
        '---',
        '## 見出し',
        '1行目',
        '2行目は**太字**と[リンク](/learn)と[[123m]]',
        '',
        '- いち',
        '- に',
        '',
        '| 役 | 翻 |',
        '| --- | --- |',
        '| 立直 | 1 |',
        '',
        '> 注意',
        '@tiles 123m456p789s1122z 説明の文',
        '@drill /practice/waits',
      ].join('\n'),
    )
    expect(a.meta).toEqual({ title: 'テスト', description: '説明', order: 5, category: '基本', drills: ['/practice/waits', '/practice/efficiency'], related: ['a', 'b'] })
    expect(a.blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'list', 'table', 'note', 'tiles', 'drill'])
    const p = a.blocks[1] as Extract<Block, { type: 'paragraph' }>
    expect(p.children.map((c) => c.type)).toEqual(['text', 'strong', 'text', 'link', 'text', 'tiles'])
    const t = a.blocks[3] as Extract<Block, { type: 'table' }>
    expect(t.rows).toHaveLength(1)
    expect(a.blocks[5]).toEqual({ type: 'tiles', tiles: '123m456p789s1122z', caption: '説明の文' })
    expect(() => parseArticle('本文だけ')).toThrow()
  })

  it('@points は「この記事でわかること」、@figure は図解になる', () => {
    const a = parseArticle('---\ntitle: t\n---\n@points\n- いち\n- **に**\n@figure fu-stack\n本文\n')
    expect(a.blocks.map((b) => b.type)).toEqual(['points', 'figure', 'paragraph'])
    expect(a.blocks[0]).toEqual({ type: 'points', items: [[{ type: 'text', text: 'いち' }], [{ type: 'strong', children: [{ type: 'text', text: 'に' }] }]] })
    expect(a.blocks[1]).toEqual({ type: 'figure', id: 'fu-stack' })
  })

  it('{{用語}} は用語部品、@glossary は用語集になる', () => {
    expect(parseInline('{{面子}}と{{めんつ|mentsu}}')).toEqual([
      { type: 'term', key: '面子', text: '面子' },
      { type: 'text', text: 'と' },
      { type: 'term', key: 'mentsu', text: 'めんつ' },
    ])
    const a = parseArticle('---\ntitle: t\n---\n説明\n@glossary\n')
    expect(a.blocks.map((b) => b.type)).toEqual(['paragraph', 'glossary'])
  })

  it('閉じていない ** や [ はそのまま文字にする', () => {
    expect(parseInline('5**と[だけ')).toEqual([{ type: 'text', text: '5**と[だけ' }])
  })
})

/** 記事の中のリンクと牌の表記をすべて集める */
function collect(blocks: readonly Block[]) {
  const links: string[] = []
  const tiles: string[] = []
  const terms: string[] = []
  const walk = (nodes: readonly Inline[]) => {
    for (const n of nodes) {
      if (n.type === 'link') {
        links.push(n.href)
        walk(n.children)
      } else if (n.type === 'strong') walk(n.children)
      else if (n.type === 'tiles') tiles.push(n.tiles)
      else if (n.type === 'term') terms.push(n.key)
    }
  }
  for (const b of blocks) {
    if (b.type === 'paragraph' || b.type === 'note') walk(b.children)
    else if (b.type === 'list' || b.type === 'points') b.items.forEach(walk)
    else if (b.type === 'table') [b.header, ...b.rows].flat().forEach(walk)
    else if (b.type === 'tiles') tiles.push(b.tiles)
    else if (b.type === 'drill') links.push(b.path)
  }
  return { links, tiles, terms }
}

describe('解説記事', () => {
  const sitePaths = new Set([
    ...NAV_ITEMS.flatMap((i) => [i.path, ...(i.children ?? []).map((c) => c.path)]),
    ...ARTICLES.map((a) => a.path),
    '/score-table',
    '/today',
    '/practice/judgment/pushfold',
    '/practice/judgment/plan',
    '/practice/judgment/call',
  ])

  it('記事がある', () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(10)
  })

  for (const a of ARTICLES) {
    describe(a.meta.title, () => {
      it('本文は1,500〜3,000文字(用語集は用語データから作るので除く)', () => {
        if (a.blocks.some((b) => b.type === 'glossary')) return
        const n = articleLength(a.blocks, (id) => FIGURES[id]?.alt ?? '')
        expect(n, `${a.slug}: ${n}文字`).toBeGreaterThanOrEqual(1500)
        expect(n, `${a.slug}: ${n}文字`).toBeLessThanOrEqual(3000)
      })

      it('冒頭に「この記事でわかること」(3行)、最後に「まとめ」(3〜5行)がある', () => {
        const first = a.blocks[0]
        expect(first?.type, a.slug).toBe('points')
        if (first?.type === 'points') expect(first.items, a.slug).toHaveLength(3)
        const h2 = a.blocks.filter((b) => b.type === 'heading' && b.level === 2)
        const last = h2[h2.length - 1]
        expect(last?.type === 'heading' && last.text, a.slug).toBe('まとめ')
        const after = a.blocks.slice(a.blocks.indexOf(last!) + 1).filter((b) => b.type !== 'drill')
        expect(after.map((b) => b.type), a.slug).toContain('list')
        const list = after.find((b) => b.type === 'list')
        if (list?.type === 'list') {
          expect(list.items.length, a.slug).toBeGreaterThanOrEqual(3)
          expect(list.items.length, a.slug).toBeLessThanOrEqual(5)
        }
      })

      it('図解はすべて登録されていて、代替テキストがある', () => {
        for (const b of a.blocks) if (b.type === 'figure') expect(FIGURES[b.id]?.alt.length ?? 0, `${a.slug}: ${b.id}`).toBeGreaterThan(30)
      })

      it('説明・分類・ドリルがそろっている', () => {
        expect(a.meta.description.length).toBeGreaterThan(10)
        expect(['基本', '牌効率', '守備', '点数', '判断', 'その他']).toContain(a.meta.category)
        expect(a.meta.drills.length).toBeGreaterThan(0)
        for (const d of a.meta.drills) expect(findPageInfo(d), `${a.slug}: ${d}`).toBeDefined()
      })

      it('リンク先・関連記事がある', () => {
        const { links } = collect(a.blocks)
        for (const l of links) {
          if (/^https?:/.test(l)) continue
          expect(sitePaths.has(l.split('#')[0]), `${a.slug}: ${l}`).toBe(true)
        }
        for (const r of a.meta.related) expect(ARTICLES.some((x) => x.slug === r), `${a.slug}: related ${r}`).toBe(true)
      })

      it('用語は初出だけに付け、漢字だけの用語には初出で読み仮名を付ける', () => {
        const seen = new Set<string>()
        const kanjiOnly = (t: string) => /^[\u4e00-\u9fff々]+$/.test(t)
        const walk = (nodes: readonly Inline[]) =>
          nodes.forEach((n, i) => {
            if (n.type === 'strong' || n.type === 'link') walk(n.children)
            if (n.type !== 'term') return
            const id = findTerm(n.key)?.id ?? n.key
            expect(seen.has(id), `${a.slug}: ${n.text} が2回目`).toBe(false)
            seen.add(id)
            const next = nodes[i + 1]
            // 「四{{暗刻}}{{単騎}}(…)」のような複合語は、語全体の後ろに読み仮名を付ける
            const compound = next?.type === 'term' || (next?.type === 'text' && /^[\u4e00-\u9fff]/.test(next.text))
            if (kanjiOnly(n.text) && !compound) expect(next?.type === 'text' && /^[((]/.test(next.text), `${a.slug}: ${n.text} に読み仮名がない`).toBe(true)
          })
        for (const b of a.blocks) {
          if (b.type === 'paragraph' || b.type === 'note') walk(b.children)
          else if (b.type === 'list' || b.type === 'points') b.items.forEach(walk)
          else if (b.type === 'table') [b.header, ...b.rows].flat().forEach(walk)
        }
      })

      it('用語({{…}})はすべて用語データにある', () => {
        for (const key of collect(a.blocks).terms) expect(findTerm(key), `${a.slug}: ${key}`).toBeDefined()
      })

      it('牌の表記が正しい(4枚を超えない)', () => {
        for (const t of collect(a.blocks).tiles) {
          const tiles = parseTiles(t)
          expect(tiles.length, `${a.slug}: ${t}`).toBeGreaterThan(0)
          expect(checkTileSet(tiles), `${a.slug}: ${t}`).toEqual([])
        }
      })
    })
  }
})

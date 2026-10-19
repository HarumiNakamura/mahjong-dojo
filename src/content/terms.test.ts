import { describe, expect, it } from 'vitest'
import { checkTileSet, parseTiles } from '../engine/tiles'
import { ARTICLES } from './articles'
import { findTerm, kanaRow, sortByReading, TERM_CATEGORIES, TERMS, termHref } from './terms'

describe('用語データ', () => {
  it('id・用語・別名がほかの用語と重ならない', () => {
    const keys = TERMS.flatMap((t) => [t.id, t.word, ...(t.aliases ?? [])].map((k) => `${k}`))
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i && TERMS.filter((t) => t.id === k || t.word === k || t.aliases?.includes(k)).length > 1)
    expect(dup).toEqual([])
    const ids = TERMS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  it('すべての用語に読み(カタカナ)と40字以内の意味がある', () => {
    for (const t of TERMS) {
      expect(t.reading, t.word).toMatch(/^[ァ-ヴー]+$/)
      expect(t.meaning.length, t.word).toBeGreaterThan(0)
      expect(t.meaning.length, `${t.word}: ${t.meaning}`).toBeLessThanOrEqual(40)
      expect(TERM_CATEGORIES).toContain(t.category)
    }
  })

  it('牌の例が正しく、詳しい説明の記事がある(リンク切れがない)', () => {
    const articlePaths = new Set(ARTICLES.map((a) => a.path))
    for (const t of TERMS) {
      if (t.tiles) {
        const tiles = parseTiles(t.tiles)
        expect(tiles.length, t.word).toBeGreaterThan(0)
        expect(checkTileSet(tiles), t.word).toEqual([])
      }
      if (t.article) expect(articlePaths.has(t.article), `${t.word}: ${t.article}`).toBe(true)
    }
  })

  it('面子・順子・刻子・対子・ターツ・雀頭・待ちの形には牌の例がある', () => {
    for (const w of ['面子', '順子', '刻子', '対子', 'ターツ', '雀頭', '両面', '嵌張', '辺張', '双碰', '単騎']) expect(findTerm(w)?.tiles, w).toBeTruthy()
  })

  it('記事で使う言葉がそろっている', () => {
    for (const w of ['翻', '符', 'オタ風', '自風', '場風', '引っかけ', 'シャンテン戻し', '良形', '愚形', '片スジ', '両スジ', 'ノーチャンス', 'ワンチャンス', 'ダマ', '放銃', '副露']) {
      expect(findTerm(w), w).toBeDefined()
    }
  })

  it('id・用語・別名のどれでも探せ、用語集の URL がわかる', () => {
    expect(findTerm('mentsu')?.word).toBe('面子')
    expect(findTerm('リャンメン')).toBeUndefined()
    expect(findTerm('両面待ち')?.id).toBe('ryanmen')
    expect(termHref(findTerm('面子')!)).toBe('/learn/glossary#mentsu')
  })

  it('50音の行と並べ替え', () => {
    expect(kanaRow('メンツ')).toBe('マ')
    expect(kanaRow('ガ')).toBe('カ')
    expect(kanaRow('ピンフ')).toBe('ハ')
    expect(kanaRow('ジャントウ')).toBe('サ')
    expect(kanaRow('ワンパイ')).toBe('ワ')
    const sorted = sortByReading(TERMS)
    expect(sorted).toHaveLength(TERMS.length)
  })
})

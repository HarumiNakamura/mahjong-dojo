import { describe, expect, it } from 'vitest'
import { findComingSoonPage, LEARN_PAGE, NAV_ITEMS, PRACTICE_PAGES, RECORDS_PAGE } from './routes'
import { normalizePath } from './router'

describe('ページ構成', () => {
  it('練習は牌効率・一人麻雀・待ち・点数計算・守備・判断', () => {
    expect(PRACTICE_PAGES.map((p) => p.title)).toEqual(['牌効率', '一人麻雀', '待ち', '点数計算', '守備', '判断'])
    for (const p of PRACTICE_PAGES) expect(p.path.startsWith('/practice/')).toBe(true)
  })

  it('ナビゲーションはホーム・練習・解説・学習記録・このサイトについて', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(['ホーム', '練習', '解説', '学習記録', 'このサイトについて'])
    expect(NAV_ITEMS[1].children).toHaveLength(6)
  })

  it('パスはすべて重ならない', () => {
    const paths = [...NAV_ITEMS.map((i) => i.path), ...PRACTICE_PAGES.map((p) => p.path)]
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('準備中のページはパスから見つかる', () => {
    expect(findComingSoonPage('/practice/judgment')).toBeUndefined()
    expect(findComingSoonPage('/practice/judgment/call')).toBeUndefined()
    expect(findComingSoonPage('/practice/score')).toBeUndefined()
    expect(findComingSoonPage('/practice/waits')).toBeUndefined()
    expect(findComingSoonPage(LEARN_PAGE.path)).toBeUndefined()
    // 学習記録はできあがったので準備中ではない
    expect(findComingSoonPage(RECORDS_PAGE.path)).toBeUndefined()
    expect(findComingSoonPage('/practice/efficiency')).toBeUndefined()
    expect(findComingSoonPage('/nothing')).toBeUndefined()
  })

  it('末尾の / は取り除いて扱う', () => {
    expect(normalizePath('/practice/')).toBe('/practice')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('')).toBe('/')
  })
})

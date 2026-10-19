import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../content/articles'
import { fullTitle, pageMeta, prerenderPaths, sitemapPaths } from './seo'

describe('検索対策', () => {
  it('ビルド時に作るページは、題名と説明がそろっていて重ならない', () => {
    const paths = prerenderPaths()
    expect(new Set(paths).size).toBe(paths.length)
    for (const p of paths) {
      const m = pageMeta(p)
      expect(m.description.length, p).toBeGreaterThan(10)
      expect(m.image, p).toMatch(/^\/og\/[a-z0-9-]+\.png$/)
      if (p !== '/') expect(m.title, p).not.toBe('')
    }
  })

  it('記事はすべて本文まで HTML にし、サイトマップに載る', () => {
    const sitemap = sitemapPaths()
    for (const a of ARTICLES) {
      expect(pageMeta(a.path).prerenderBody).toBe(true)
      expect(sitemap).toContain(a.path)
    }
  })

  it('共有・解き直し・開発用・見つからないページは検索に出さない', () => {
    for (const p of ['/q/efficiency', '/records/review/waits/mistakes', '/dev/tiles', '/nothing', '/learn/nothing']) {
      expect(pageMeta(p).noindex, p).toBe(true)
      expect(sitemapPaths()).not.toContain(p)
    }
    expect(pageMeta('/q/call').image).toBe('/og/call.png')
  })

  it('題名にはサイト名がつく', () => {
    expect(fullTitle(pageMeta('/learn/flow'))).toBe('麻雀の基本の流れ | 麻雀道場(仮)')
    expect(fullTitle(pageMeta('/'))).toContain('麻雀道場(仮)')
  })
})

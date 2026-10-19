import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../content/articles'
import { SITE_NAME, SITE_URL, siteTitle } from '../config/site'
import { fullTitle, pageMeta, prerenderPaths, sitemapPaths, structuredData } from './seo'

describe('検索対策', () => {
  it('ビルド時に作るページは、題名と説明がそろっていて重ならない', () => {
    const paths = prerenderPaths()
    expect(new Set(paths).size).toBe(paths.length)
    for (const p of paths) {
      const m = pageMeta(p)
      expect(m.description.length, p).toBeGreaterThan(10)
      expect(m.image, p).toMatch(/^\/og\/(articles\/)?[a-z0-9-]+\.png$/)
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
    expect(fullTitle(pageMeta('/learn/flow'))).toBe('麻雀のルールと流れ|初心者向けに1局の進み方をやさしく解説 | 麻雀道場(仮)')
    expect(fullTitle(pageMeta('/'))).toBe('麻雀道場(仮) | 麻雀初心者のための練習サイト')
  })

  it('記事は検索向けの題名(30字前後)・記事ごとの OGP 画像・構造化データを持つ', () => {
    for (const a of ARTICLES) {
      expect(a.meta.seoTitle, a.slug).toBeTruthy()
      expect(a.meta.seoTitle!.length, a.slug).toBeLessThanOrEqual(36)
      expect(pageMeta(a.path).image).toBe(`/og/articles/${a.slug}.png`)
      const [crumbs, article] = structuredData(a.path) as { '@type': string; headline?: string }[]
      expect(crumbs['@type']).toBe('BreadcrumbList')
      expect(article.headline).toBe(a.meta.seoTitle)
    }
    expect(structuredData('/practice')).toEqual([])
  })

  it('サイト名と URL は設定(src/config/site.ts)から作る', () => {
    expect(SITE_URL).not.toMatch(/\/$/)
    expect(siteTitle('牌効率')).toBe(`牌効率 | ${SITE_NAME}`)
  })
})

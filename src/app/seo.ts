// 検索対策: ページごとの題名・説明・OGP 画像と、ビルド時に HTML を作るページの一覧
//
// ここは画面の部品を使わない(ビルド時の HTML 作り・サイトマップ作りからも使う)。

import { ARTICLES, findArticle } from '../content/articles'
import { findDrill, DRILLS } from '../drills/registry'
import { ogImagePath } from './ogp'
import { findPageInfo, JUDGMENT_PAGES, PRACTICE_PAGES } from './routes'

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, siteTitle } from '../config/site'

export { SITE_DESCRIPTION, SITE_NAME, SITE_URL }

export interface PageMeta {
  /** ページの題名(サイト名は含まない。ホームは空) */
  title: string
  description: string
  /** OGP 画像のパス */
  image: string
  /** 検索結果に出さない(開発用・共有・解き直し・見つからないページ) */
  noindex: boolean
  /** ビルド時に本文まで HTML にする(内容が毎回同じページ) */
  prerenderBody: boolean
}

/** 練習ページと OGP 画像の対応 */
const PRACTICE_OG: Record<string, string> = {
  '/practice/efficiency': 'efficiency',
  '/practice/waits': 'waits',
  '/practice/score': 'score',
  '/practice/defense': 'safety',
  '/practice/judgment/pushfold': 'pushfold',
  '/practice/judgment/plan': 'plan',
  '/practice/judgment/call': 'call',
  '/practice/solo': 'efficiency',
  '/score-table': 'score',
}

const STATIC_PAGES: Record<string, { title: string; description: string; prerenderBody?: boolean }> = {
  '/': { title: '', description: SITE_DESCRIPTION },
  '/practice': { title: '練習', description: '牌効率・一人麻雀・待ち・点数計算・守備・判断の練習メニューです。', prerenderBody: true },
  '/about': { title: 'このサイトについて', description: `${SITE_NAME}の目的・使い方・Mリーグルール準拠であることなど、このサイトについての説明です。`, prerenderBody: true },
  '/privacy': { title: 'プライバシーポリシー', description: '学習記録はブラウザの中だけに保存され、運営者には送られません。広告(Google アドセンス)の Cookie についても説明します。', prerenderBody: true },
  '/contact': { title: '運営者情報・お問い合わせ', description: `${SITE_NAME}の運営者情報と、お問い合わせフォームの案内です。`, prerenderBody: true },
  '/disclaimer': { title: '免責事項', description: '正解の判定や危険度・押し引きの数値は、統計をもとにした目安です。サイトの利用についての注意をまとめています。', prerenderBody: true },
  '/records': { title: '学習記録', description: 'これまでの正解率や間違えた問題を確認し、解き直せます。記録はこの端末のブラウザに保存されます。' },
  '/learn': { title: '解説', description: '麻雀の基本から、牌効率・守備・点数計算・判断の考え方までを読んで学べる解説記事の一覧です。', prerenderBody: true },
}

const fix = (title: string, description: string, image = ogImagePath('default')): PageMeta => ({
  title,
  description,
  image,
  noindex: false,
  prerenderBody: false,
})

/** パスに対応するページの情報 */
export function pageMeta(path: string): PageMeta {
  const fixed = STATIC_PAGES[path]
  if (fixed) return { ...fix(fixed.title, fixed.description), prerenderBody: fixed.prerenderBody === true }
  const article = path.startsWith('/learn/') ? findArticle(path.slice(7)) : undefined
  if (article) return { ...fix(article.meta.seoTitle ?? article.meta.title, article.meta.description, articleOgPath(article.slug)), prerenderBody: true }
  const info = findPageInfo(path)
  if (info) {
    const list = path === '/practice/judgment' || path === '/score-table'
    return {
      ...fix(info.title, info.description, ogImagePath(PRACTICE_OG[path] ?? 'default')),
      prerenderBody: list,
    }
  }
  const shared = path.match(/^\/q\/([a-z0-9-]+)$/)
  const drill = shared ? findDrill(shared[1]) : undefined
  if (drill) {
    return { ...fix(`${drill.title}の問題`, `${SITE_NAME}の「${drill.title}」の問題です。あなたならどうする?`, ogImagePath(drill.id)), noindex: true }
  }
  if (/^\/records\/review\//.test(path)) return { ...fix('解き直し', '間違えた問題・お気に入りの問題を解き直します。'), noindex: true }
  // CPU対戦の牌譜・振り返り・成績は、この端末の記録を表示するページなので検索結果に出さない
  if (path === '/play/stats') return { ...fix('CPU対戦の成績', 'CPU対戦の通算成績(平均順位・ポイント・アガリ率・放銃率など)を難易度ごとに確認します。'), noindex: true }
  if (path === '/play/review') return { ...fix('CPU対戦の振り返り', 'CPU対戦の半荘を振り返り、分かれ目と改善点を確認します。'), noindex: true }
  if (path === '/play/replay') return { ...fix('CPU対戦の牌譜', 'CPU対戦の牌譜を1手ずつ見直します。'), noindex: true }
  if (path.startsWith('/dev/')) return { ...fix('開発用ページ', '表示の確認用のページです。'), noindex: true }
  return { ...fix('ページが見つかりません', 'お探しのページは見つかりませんでした。'), noindex: true }
}

/** 記事ごとの OGP 画像(ビルド時に scripts/prerender.mjs が作る) */
export const articleOgPath = (slug: string) => `/og/articles/${slug}.png`

/** 構造化データ(JSON-LD)。記事はパンくずと記事の情報 */
export function structuredData(path: string): object[] {
  const article = path.startsWith('/learn/') ? findArticle(path.slice(7)) : undefined
  if (!article) return []
  const url = `${SITE_URL}${path}`
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: '解説', item: `${SITE_URL}/learn` },
        { '@type': 'ListItem', position: 3, name: article.meta.title, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.meta.seoTitle ?? article.meta.title,
      description: article.meta.description,
      image: [`${SITE_URL}${articleOgPath(article.slug)}`],
      inLanguage: 'ja',
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
    },
  ]
}

/** ビルド時に HTML を作るページ(見つからないページ以外のすべて) */
export function prerenderPaths(): string[] {
  return [
    ...Object.keys(STATIC_PAGES),
    ...PRACTICE_PAGES.map((p) => p.path),
    ...JUDGMENT_PAGES.map((p) => p.path),
    '/score-table',
    '/today',
    ...ARTICLES.map((a) => a.path),
    ...DRILLS.map((d) => `/q/${d.id}`),
    ...DRILLS.flatMap((d) => [`/records/review/${d.id}/mistakes`, `/records/review/${d.id}/favorites`]),
    '/play',
    '/play/replay',
    '/play/review',
    '/play/stats',
    '/dev/tiles',
    '/dev/drill',
  ].filter((p, i, all) => all.indexOf(p) === i)
}

/** サイトマップに載せるページ(検索結果に出すもの) */
export function sitemapPaths(): string[] {
  return prerenderPaths().filter((p) => !pageMeta(p).noindex)
}

/** ブラウザのタブや検索結果に出す題名 */
export function fullTitle(meta: PageMeta): string {
  return siteTitle(meta.title)
}

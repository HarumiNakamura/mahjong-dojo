// 解説記事の一覧(src/content/articles/*.md を読み込む)

import { parseArticle, type ParsedArticle } from './markdown'

export interface Article extends ParsedArticle {
  /** URL に使う名前(ファイル名) */
  slug: string
  path: string
}

/** 一覧ページで分ける順番 */
export const ARTICLE_CATEGORIES = ['基本', '牌効率', '守備', '点数', '判断', 'その他'] as const

const sources = import.meta.glob('./articles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const ARTICLES: readonly Article[] = Object.entries(sources)
  .map(([file, source]) => {
    const slug = file.replace(/^.*\//, '').replace(/\.md$/, '')
    return { slug, path: `/learn/${slug}`, ...parseArticle(source) }
  })
  .sort((a, b) => a.meta.order - b.meta.order || a.slug.localeCompare(b.slug))

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

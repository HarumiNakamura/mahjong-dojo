import { useEffect } from 'react'
import { siteTitle } from '../config/site'
import { Link } from '../app/Link'
import { ArticleBody, DrillCard } from '../components/article/ArticleBody'
import { findArticle, type Article } from '../content/articles'
import { NotFoundPage } from './NotFoundPage'
import './pages.css'

/** 解説記事のページ */
export function ArticlePage({ article }: { article: Article }) {
  const headings = article.blocks.filter((b) => b.type === 'heading' && b.level === 2)
  const related = article.meta.related.map(findArticle).filter((a): a is Article => a !== undefined)
  return (
    <article>
      <p className="article-crumb">
        <Link to="/learn">解説</Link> › {article.meta.category}
      </p>
      <h1 className="page-title">{article.meta.title}</h1>
      <p className="page-lead">{article.meta.description}</p>
      {headings.length >= 3 && (
        <nav className="article-toc" aria-label="目次">
          <p>目次</p>
          <ol>
            {headings.map((h) =>
              h.type === 'heading' ? (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ) : null,
            )}
          </ol>
        </nav>
      )}
      <ArticleBody blocks={article.blocks} />

      {article.meta.drills.length > 0 && (
        <section>
          <h2 className="article-section-title">この記事のドリル</h2>
          {article.meta.drills.map((path) => (
            <DrillCard key={path} path={path} />
          ))}
        </section>
      )}
      {related.length > 0 && (
        <section>
          <h2 className="article-section-title">関連する記事</h2>
          <ul className="article-related">
            {related.map((a) => (
              <li key={a.slug}>
                <Link to={a.path}>{a.meta.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="link-row">
        <Link to="/learn" className="button">
          解説の一覧へ
        </Link>
      </div>
    </article>
  )
}

/** /learn/<slug> のページ。記事がなければ「見つかりません」 */
export function ArticleRoute({ slug }: { slug: string }) {
  const article = findArticle(slug)
  // 検索結果と同じ題名(記事は検索向けの題名)にする
  const title = article ? (article.meta.seoTitle ?? article.meta.title) : 'ページが見つかりません'
  useEffect(() => {
    document.title = siteTitle(title)
  }, [title])
  return article ? <ArticlePage article={article} /> : <NotFoundPage />
}

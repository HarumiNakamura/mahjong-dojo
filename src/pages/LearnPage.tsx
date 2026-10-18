import { Link } from '../app/Link'
import { ARTICLE_CATEGORIES, ARTICLES } from '../content/articles'
import './pages.css'

/** 解説記事の一覧 */
export function LearnPage() {
  return (
    <>
      <h1 className="page-title">解説</h1>
      <p className="page-lead">
        麻雀の基本から、牌効率・守備・点数計算・判断の考え方まで。読んだあとは、記事の最後のドリルですぐに練習できます。
      </p>
      {ARTICLE_CATEGORIES.map((cat) => {
        const list = ARTICLES.filter((a) => a.meta.category === cat)
        if (list.length === 0) return null
        return (
          <section key={cat} className="home-section">
            <h2>{cat}</h2>
            <ul className="card-list">
              {list.map((a) => (
                <li key={a.slug}>
                  <Link to={a.path} className="card">
                    <span className="card-title">{a.meta.title}</span>
                    <span className="card-text">{a.meta.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}

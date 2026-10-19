import { IconCard } from '../components/card/IconCard'
import { ARTICLE_CATEGORIES, ARTICLES } from '../content/articles'
import './pages.css'

/** 分類ごとのアイコン(牌) */
const CATEGORY_ICONS: Record<string, string> = { 基本: '1z', 牌効率: '35m', 守備: '7z', 点数: '5z', 判断: '9m', その他: '0p' }
/** 初めての人に最初に読んでほしい記事(大きく出す) */
const FIRST_ARTICLE = 'flow'

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
            <ul className="icon-card-grid icon-card-grid--3">
              {list.map((a) => (
                <li key={a.slug} className={a.slug === FIRST_ARTICLE ? 'icon-card-grid-featured' : undefined}>
                  <IconCard to={a.path} title={a.meta.title} text={a.meta.description} icon={CATEGORY_ICONS[cat]} featured={a.slug === FIRST_ARTICLE} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}

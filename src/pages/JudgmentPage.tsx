import { Link } from '../app/Link'
import { JUDGMENT_PAGES } from '../app/routes'
import './pages.css'

export function JudgmentPage() {
  return (
    <>
      <h1 className="page-title">判断の練習</h1>
      <p className="page-lead">
        押すか降りるか、配牌からどう進めるか、鳴くかどうか。正解が1つに決まりにくい場面を、目安の計算で考えます。
      </p>
      <ul className="card-list">
        {JUDGMENT_PAGES.map((page) => (
          <li key={page.path}>
            <Link to={page.path} className="card">
              <span className="card-title">
                {page.title}
                {page.comingSoon && <span className="badge">準備中</span>}
              </span>
              <span className="card-text">{page.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

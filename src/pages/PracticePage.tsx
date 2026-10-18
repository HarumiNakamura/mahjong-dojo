import { Link } from '../app/Link'
import { PRACTICE_PAGES } from '../app/routes'
import './pages.css'

export function PracticePage() {
  return (
    <>
      <h1 className="page-title">練習</h1>
      <p className="page-lead">練習したい分野を選んでください。1問ずつ答えて、すぐに解説を確認できます。</p>
      <ul className="card-list">
        {PRACTICE_PAGES.map((page) => (
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

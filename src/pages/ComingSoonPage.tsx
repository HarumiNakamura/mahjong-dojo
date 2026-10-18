import { Link } from '../app/Link'
import type { PageInfo } from '../app/routes'
import './pages.css'

export function ComingSoonPage({ page }: { page: PageInfo }) {
  const isPractice = page.path.startsWith('/practice/')
  return (
    <>
      <h1 className="page-title">{page.title}</h1>
      <div className="notice">
        <p className="notice-title">このページは準備中です</p>
        <p>{page.description}</p>
        <p>できあがるまで、もうしばらくお待ちください。</p>
      </div>
      <div className="link-row">
        {isPractice && (
          <Link to="/practice" className="button">
            練習メニューへ
          </Link>
        )}
        <Link to="/" className="button">
          ホームへ
        </Link>
      </div>
    </>
  )
}

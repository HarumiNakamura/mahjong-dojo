import { Link } from '../app/Link'
import './pages.css'

export function NotFoundPage() {
  return (
    <>
      <h1 className="page-title">ページが見つかりません</h1>
      <p className="page-lead">URL が間違っているか、ページが移動した可能性があります。</p>
      <div className="link-row">
        <Link to="/" className="button button--primary">
          ホームへ
        </Link>
        <Link to="/practice" className="button">
          練習メニュー
        </Link>
        <Link to="/learn" className="button">
          解説の一覧
        </Link>
      </div>
    </>
  )
}

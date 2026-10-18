import { Link } from '../app/Link'
import { LEARN_PAGE, PRACTICE_PAGES, RECORDS_PAGE } from '../app/routes'
import { Hand } from '../components/tile/Hand'
import { parseTiles } from '../engine/tiles'
import './pages.css'

const SAMPLE_HAND = parseTiles('123m406p789s1122z')

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <h1 className="home-title">麻雀道場(仮)</h1>
        <p className="home-lead">
          麻雀を覚えたばかりの人のための練習サイトです。
          <br />
          解説を読んで、すぐ手を動かして、なぜ正解なのかを画面で確かめられます。
        </p>
        <div className="home-hand" aria-label="手牌の例">
          <Hand tiles={SAMPLE_HAND} />
        </div>
        <Link to="/practice" className="button button--primary button--block">
          練習をはじめる
        </Link>
      </section>

      <section className="home-section">
        <h2>練習メニュー</h2>
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
      </section>

      <section className="home-section">
        <h2>読む・ふりかえる</h2>
        <ul className="card-list">
          {[LEARN_PAGE, RECORDS_PAGE].map((page) => (
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
      </section>

      <section className="home-section">
        <h2>このサイトの特長</h2>
        <ul className="feature-list">
          <li>登録やログインは不要です。学習記録はお使いのブラウザに保存されます。</li>
          <li>正解と解説はプログラムで計算しているので、なぜその答えになるのかを数字で確かめられます。</li>
          <li>スマートフォンの縦画面で使いやすいように作っています。</li>
        </ul>
        <p>
          <Link to="/about">このサイトについて詳しく見る</Link>
        </p>
      </section>
    </>
  )
}

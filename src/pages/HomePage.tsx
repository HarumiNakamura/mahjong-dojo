import { Link } from '../app/Link'
import { LEARN_PAGE, PLAY_PAGE, PRACTICE_PAGES, RECORDS_PAGE, SCORE_TABLE_PAGE } from '../app/routes'
import { IconCard } from '../components/card/IconCard'
import { SITE_NAME } from '../config/site'
import { HomeQuiz } from './home/HomeQuiz'
import { ProgressSections } from './home/ProgressSections'
import './pages.css'

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <h1 className="home-title">{SITE_NAME}</h1>
        <p className="home-lead">麻雀を覚えたばかりの人のための練習サイトです。解説を読んで、すぐ手を動かして、なぜ正解なのかを画面で確かめられます。</p>
      </section>

      <HomeQuiz />

      <ProgressSections />

      <section className="home-section">
        <h2>練習メニュー</h2>
        <ul className="icon-card-grid icon-card-grid--3">
          {[...PRACTICE_PAGES, PLAY_PAGE].map((page) => (
            <li key={page.path} className={page.featured ? 'icon-card-grid-featured' : undefined}>
              <IconCard to={page.path} title={page.title} text={page.description} icon={page.icon} featured={page.featured} />
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section">
        <h2>読む・ふりかえる</h2>
        <ul className="icon-card-grid icon-card-grid--3">
          {[
            { ...LEARN_PAGE, icon: '1z' },
            { ...SCORE_TABLE_PAGE, icon: '7z' },
            { ...RECORDS_PAGE, icon: '9p' },
          ].map((page) => (
            <li key={page.path}>
              <IconCard to={page.path} title={page.title} text={page.description} icon={page.icon} />
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

// ビルド時の HTML に入れる、ページの紹介(見出し・紹介文・各ページへのリンク)
//
// 練習の画面のように中身が毎回変わるページは、本文を HTML にできない。そのかわりに、
// 検索エンジンや JavaScript を読む前の人のために、ここで作った紹介を HTML に入れておく。
// ブラウザでは画面ができたら置きかわる(src/main.tsx)。scripts/prerender.mjs から使う。

import { JUDGMENT_PAGES, LEARN_PAGE, PLAY_PAGE, PRACTICE_PAGES, RECORDS_PAGE, SCORE_TABLE_PAGE, TODAY_PAGE, type PageInfo } from '../app/routes'
import { pageMeta } from '../app/seo'
import { Layout } from '../components/layout/Layout'
import { SITE_NAME } from '../config/site'
import { ARTICLES } from '../content/articles'

function LinkList({ pages }: { pages: readonly PageInfo[] }) {
  return (
    <ul className="card-list">
      {pages.map((p) => (
        <li key={p.path}>
          <a href={p.path} className="card">
            <span className="card-title">{p.title}</span>
            <span className="card-text">{p.description}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function HomeShell() {
  return (
    <>
      <h1 className="page-title">{SITE_NAME}</h1>
      <p className="page-lead">
        麻雀を覚えたばかりの人のための練習サイトです。解説を読んで、すぐ手を動かして、なぜ正解なのかを画面で確かめられます。牌効率・待ち・守備・押し引き・点数計算・配牌方針を1つのサイトで学べます。
      </p>
      <h2>練習</h2>
      <LinkList pages={[...PRACTICE_PAGES, TODAY_PAGE, PLAY_PAGE]} />
      <h2>解説</h2>
      <LinkList pages={ARTICLES.map((a) => ({ path: a.path, title: a.meta.title, description: a.meta.description }))} />
      <h2>ふりかえる</h2>
      <LinkList pages={[SCORE_TABLE_PAGE, RECORDS_PAGE, LEARN_PAGE]} />
    </>
  )
}

function PracticeShell({ path }: { path: string }) {
  const meta = pageMeta(path)
  const articles = ARTICLES.filter((a) => a.meta.drills.includes(path))
  const subPages = path === '/practice/judgment' ? JUDGMENT_PAGES : []
  return (
    <>
      <h1 className="page-title">{meta.title}</h1>
      <p className="page-lead">{meta.description}</p>
      {subPages.length > 0 && <LinkList pages={subPages} />}
      {articles.length > 0 && (
        <>
          <h2>この練習の解説</h2>
          <LinkList pages={articles.map((a) => ({ path: a.path, title: a.meta.title, description: a.meta.description }))} />
        </>
      )}
      <p>
        <a href="/practice">練習メニューへ</a>
      </p>
    </>
  )
}

/** ページの紹介(サイトの枠つき) */
export function PageShell({ path }: { path: string }) {
  const meta = pageMeta(path)
  return (
    <Layout title={meta.title} hideAd>
      {path === '/' ? <HomeShell /> : <PracticeShell path={path} />}
    </Layout>
  )
}

import '@fontsource/biz-udpgothic/400.css'
import '@fontsource/biz-udpgothic/700.css'
import '@fontsource/shippori-mincho-b1/800.css'
import '@fontsource/zen-maru-gothic/700.css'
import '@fontsource/zen-kaku-gothic-new/900.css'
import { useState, type CSSProperties } from 'react'
import { readQuery } from '../../app/router'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { THEMES, themeVars, type Mode, type ThemeId } from '../../dev/themes'
import { parseTiles } from '../../engine/tiles'
import './DevThemePage.css'

const t = (s: string) => parseTiles(s)

/** 練習メニューのカードのアイコン(牌の絵で作る) */
const ICONS: { title: string; text: string; tiles: string; big?: boolean }[] = [
  { title: '何切る(牌効率)', text: 'どれを切れば早くテンパイ?', tiles: '35m', big: true },
  { title: '待ち当て', text: 'テンパイの待ちを全部見つける', tiles: '23s' },
  { title: '守備', text: 'リーチに安全な牌を選ぶ', tiles: '1z' },
  { title: '点数計算', text: '翻と符から点数を出す', tiles: '7z' },
  { title: '一人麻雀', text: '18巡で何回テンパイできる?', tiles: '0p' },
  { title: 'CPU対戦', text: '半荘を打って振り返る', tiles: '5z' },
]

function PracticeIcon({ tiles }: { tiles: string }) {
  return (
    <span className="tp-icon" aria-hidden="true">
      {t(tiles).map((x, i) => (
        <Tile key={i} tile={x} showLabel={false} />
      ))}
    </span>
  )
}

function HomeMock() {
  return (
    <div className="tp-screen">
      <section className="tp-hero">
        <h1 className="tp-h1">麻雀道場</h1>
        <p>解説を読んで、すぐ手を動かして、なぜ正解かを画面で確かめる。</p>
        <div className="tp-scene">
          <Hand tiles={t('123m406p789s1122z')} />
        </div>
        <button type="button" className="tp-button tp-button--primary">
          1問だけ解いてみる
        </button>
      </section>
      <h2 className="tp-h2">練習メニュー</h2>
      <ul className="tp-cards">
        {ICONS.map((c) => (
          <li key={c.title} className={`tp-card${c.big ? ' tp-card--big' : ''}`}>
            <PracticeIcon tiles={c.tiles} />
            <span>
              <strong>{c.title}</strong>
              <span className="tp-muted">{c.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArticleMock() {
  return (
    <article className="tp-screen">
      <p className="tp-muted tp-crumb">解説 › 牌効率</p>
      <h1 className="tp-h1">牌効率の基本</h1>
      <p className="tp-lead">早くテンパイするための考え方を、3つのポイントで説明します。</p>
      <h2 className="tp-h2">孤立牌から切る</h2>
      <p>
        <span className="tp-term">孤立牌</span>はほかの牌とつながっていないので、切っても手の形が崩れません。字牌 → 1・9 → 2・8 の順に切るのが基本です。
      </p>
      <figure className="tp-figure">
        <div className="tp-scene">
          <Hand tiles={t('123m79m45p2p11s5z678s')} />
        </div>
        <figcaption className="tp-muted">2筒と白が孤立牌</figcaption>
      </figure>
      <table className="tp-table">
        <thead>
          <tr>
            <th>切る順</th>
            <th>理由</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>字牌</td>
            <td>同じ牌しかくっつかない</td>
          </tr>
          <tr>
            <td>1・9</td>
            <td>片側にしかつながらない</td>
          </tr>
        </tbody>
      </table>
      <p className="tp-note">ドラや役牌の対子は、牌効率より打点を優先して残すこともあります。</p>
    </article>
  )
}

function DrillMock() {
  return (
    <div className="tp-screen">
      <div className="tp-meta">
        <span className="tp-badge">初級</span>
        <span>8巡目</span>
        <span className="tp-dora">
          ドラ表示牌 <Tile tile={t('2p')[0]} showLabel={false} />
        </span>
      </div>
      <p className="tp-prompt">何を切りますか?</p>
      <div className="tp-pick">
        <Hand tiles={t('234m79m45p2p11s5z67s')} drawn={t('8s')[0]} onPick={() => {}} />
      </div>
      <div className="tp-result">
        <p>
          <span className="tp-ok">正解</span> 2筒は孤立牌なので、切っても手の形が崩れません。
        </p>
        <div className="tp-bars">
          {[
            ['2筒', 12, true],
            ['白', 12, true],
            ['9萬', 8, false],
          ].map(([name, n, best]) => (
            <div key={String(name)} className="tp-bar-row">
              <span>{name}</span>
              <span className="tp-bar">
                <span className={`tp-bar-fill${best ? '' : ' tp-bar-fill--sub'}`} style={{ width: `${(Number(n) / 12) * 100}%` }} />
              </span>
              <span>{n}枚</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tp-actions">
        <button type="button" className="tp-button">
          解説を読む
        </button>
        <button type="button" className="tp-button tp-button--primary">
          次の問題
        </button>
      </div>
    </div>
  )
}

/** デザイン3案の比較(開発用。本番のページには使っていない) */
export function DevThemePage() {
  const q = readQuery()
  const [themeId, setThemeId] = useState<ThemeId>((THEMES.find((x) => x.id === q.get('t'))?.id ?? 'dojo') as ThemeId)
  const [mode, setMode] = useState<Mode>(q.get('m') === 'dark' ? 'dark' : 'light')
  const [narrow, setNarrow] = useState(true)
  const theme = THEMES.find((x) => x.id === themeId)!
  const c = theme.colors[mode]

  return (
    <>
      <h1 className="page-title">デザイン3案の比較</h1>
      <p className="page-lead">ホーム・解説記事・何切るの見本を、案とライト/ダークを切り替えて見比べます(開発用。本番にはまだ使っていません)。</p>
      <div className="tp-controls">
        <div role="group" aria-label="案">
          {THEMES.map((x) => (
            <button key={x.id} type="button" className="tp-switch" aria-pressed={x.id === themeId} onClick={() => setThemeId(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
        <div role="group" aria-label="明るさ">
          {(['light', 'dark'] as const).map((m) => (
            <button key={m} type="button" className="tp-switch" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === 'light' ? 'ライト' : 'ダーク'}
            </button>
          ))}
        </div>
        <div role="group" aria-label="幅">
          <button type="button" className="tp-switch" aria-pressed={narrow} onClick={() => setNarrow(true)}>
            スマホ幅
          </button>
          <button type="button" className="tp-switch" aria-pressed={!narrow} onClick={() => setNarrow(false)}>
            PC幅
          </button>
        </div>
      </div>
      <p className="tp-concept">
        <strong>{theme.name}</strong>:{theme.concept}
        <br />
        見出し: {theme.headingFontLabel}/本文: BIZ UDPゴシック/角丸 {theme.radius}
      </p>
      <ul className="tp-swatches" aria-label="色の一覧">
        {(['bg', 'surface', 'text', 'accent', 'accent2', 'headerBg', 'scene'] as const).map((k) => (
          <li key={k}>
            <span className="tp-swatch" style={{ background: c[k] }} />
            {k} {c[k]}
          </li>
        ))}
      </ul>

      <div className={`tp tp--${theme.id}${narrow ? ' tp--narrow' : ''}`} style={themeVars(theme, mode) as CSSProperties}>
        <header className="tp-header">
          <span className="tp-logo">麻雀道場</span>
          <span className="tp-menu">メニュー</span>
        </header>
        <div className="tp-screens">
          <section>
            <p className="tp-label">ホーム</p>
            <HomeMock />
          </section>
          <section>
            <p className="tp-label">解説記事</p>
            <ArticleMock />
          </section>
          <section>
            <p className="tp-label">何切る</p>
            <DrillMock />
          </section>
        </div>
      </div>
    </>
  )
}

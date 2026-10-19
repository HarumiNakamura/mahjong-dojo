import { useEffect, useState, type ReactNode } from 'react'
import { Link } from '../../app/Link'
import { usePath } from '../../app/router'
import { JUDGMENT_PAGES, LEARN_PAGE, NAV_ITEMS, PRACTICE_PAGES, RECORDS_PAGE, SCORE_TABLE_PAGE, SITE_PAGES, TODAY_PAGE } from '../../app/routes'
import { AdSlot } from './AdSlot'
import './layout.css'

const SITE_NAME = '麻雀道場(仮)'

/** フッターに並べるリンク(サイトのすべてのページ) */
const FOOTER_GROUPS = [
  { title: '練習', links: [{ path: '/practice', title: '練習メニュー' }, ...PRACTICE_PAGES, ...JUDGMENT_PAGES, TODAY_PAGE] },
  { title: '読む・ふりかえる', links: [LEARN_PAGE, SCORE_TABLE_PAGE, RECORDS_PAGE] },
  { title: 'このサイト', links: [{ path: '/', title: 'ホーム' }, ...SITE_PAGES] },
]

interface LayoutProps {
  /** ページの題名(ブラウザのタブに出す)。null ならページ自身が設定する */
  title?: string | null
  children: ReactNode
  /** 広告枠を出さない(操作ボタンが画面の下にあるページ) */
  hideAd?: boolean
}

/** サイト共通の枠: ヘッダー・ナビゲーション・本文・広告枠・フッター */
export function Layout({ title, children, hideAd = false }: LayoutProps) {
  const path = usePath()
  // メニューを開いたときのページ。別のページに移ったら自動的に閉じた扱いになる
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const menuOpen = menuOpenedAt === path
  const close = () => setMenuOpenedAt(null)

  useEffect(() => {
    if (title === null) return
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  }, [title])

  // Esc キーでメニューを閉じる
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpenedAt(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-logo" onClick={close}>
            麻雀道場<span className="site-logo-sub">(仮)</span>
          </Link>
          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpenedAt(menuOpen ? null : path)}
          >
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {menuOpen ? '閉じる' : 'メニュー'}
          </button>
          <nav id="site-nav" className={`site-nav${menuOpen ? ' site-nav--open' : ''}`} aria-label="サイト内">
            <ul className="nav-list">
              {NAV_ITEMS.map((item) => (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link${item.path !== '/' && path.startsWith(item.path) ? ' nav-link--section' : ''}`}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <ul className="nav-sublist">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link to={child.path} className="nav-link nav-link--sub" onClick={close}>
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      {menuOpen && <div className="nav-backdrop" onClick={close} aria-hidden="true" />}

      <main id="main" className="site-main" tabIndex={-1}>
        {children}
      </main>

      {!hideAd && (
        <div className="site-ad">
          <AdSlot />
        </div>
      )}

      <footer className="site-footer">
        <nav className="footer-nav" aria-label="サイトのページ一覧">
          {FOOTER_GROUPS.map((g) => (
            <div key={g.title} className="footer-group">
              <p className="footer-group-title">{g.title}</p>
              <ul>
                {g.links.map((l) => (
                  <li key={l.path}>
                    <Link to={l.path}>{l.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p>{SITE_NAME}</p>
        <p className="site-footer-note">ルールは Mリーグ公式ルールに準拠しています(Mリーグとは関係のない非公式サイトです)。</p>
      </footer>
    </div>
  )
}

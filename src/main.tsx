import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// ビルド時に本文まで HTML にしたページは、その HTML を引き継ぐ。
// 紹介だけを HTML にしたページ(data-shell)と、HTML が空のページは画面を作る(紹介は置きかわる)
if (root.hasChildNodes() && !root.hasAttribute('data-shell')) hydrateRoot(root, app)
else createRoot(root).render(app)

// 本文: BIZ UDPゴシック、見出し: しっぽり明朝 B1(どちらも SIL OFL)。サイトで使う文字だけの @font-face を、
// ページの読み込みが終わって画面ができてから(2秒後に)読み込む(最初の表示を遅らせない。scripts/build-font-css.mjs)。
// font-display: optional なので、はじめて開いたときは端末のフォントで表示し、2回目からはサイトのフォントになる
const loadFonts = () => void import('./fonts.generated.css')
const FONT_DELAY_MS = 2000
if (document.readyState === 'complete') setTimeout(loadFonts, FONT_DELAY_MS)
else window.addEventListener('load', () => setTimeout(loadFonts, FONT_DELAY_MS), { once: true })

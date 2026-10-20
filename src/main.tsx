import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startFonts } from './app/fonts'

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

// 本文・見出しのフォント(はじめては端末のフォント、2回目からサイトのフォント。src/app/fonts.ts)
startFonts()

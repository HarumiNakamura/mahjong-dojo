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
// ビルド時に本文まで HTML にしたページは、その HTML を引き継ぐ。それ以外は画面を作る
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)

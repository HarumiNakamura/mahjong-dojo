/* oxlint-disable react/only-export-components -- ビルド時だけ使うファイルで、画面の再読み込み(Fast Refresh)とは関係ない */
// ビルド時に各ページの HTML を作るための入口(scripts/prerender.mjs から使う。ブラウザでは使わない)

import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import App from './App'
import { setServerPath } from './app/router'

export { fullTitle, pageMeta, prerenderPaths, SITE_NAME, SITE_URL, sitemapPaths } from './app/seo'

/**
 * パスのページを HTML にする(ページの部品の読み込みを待ってから書き出す)。
 * 大きな本文も「読み込み中」の表示とあとから差し替える形にせず、最初から本文が入った HTML にする
 */
export async function render(path: string): Promise<string> {
  setServerPath(path)
  const { prelude } = await prerender(
    <StrictMode>
      <App />
    </StrictMode>,
    { progressiveChunkSize: Number.MAX_SAFE_INTEGER },
  )
  const html = await new Response(prelude).text()
  if (html.includes('<!--$?-->')) throw new Error(`${path}: 本文が読み込み中のまま HTML になりました`)
  return html
}

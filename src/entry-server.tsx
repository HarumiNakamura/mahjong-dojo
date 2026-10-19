/* oxlint-disable react/only-export-components -- ビルド時だけ使うファイルで、画面の再読み込み(Fast Refresh)とは関係ない */
// ビルド時に各ページの HTML を作るための入口(scripts/prerender.mjs から使う。ブラウザでは使わない)

import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import App from './App'
import { renderToStaticMarkup } from 'react-dom/server'
import { setServerPath } from './app/router'
import { TileArt } from './components/tile/TileArt'
import { ARTICLES } from './content/articles'
import { parseTiles } from './engine/tiles'
import { PageShell } from './shell/PageShell'

export { articleOgPath, fullTitle, pageMeta, prerenderPaths, SITE_NAME, SITE_URL, sitemapPaths, structuredData } from './app/seo'
export { SITE_PROVISIONAL, SITE_BASE_NAME } from './config/site'

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

/** 本文を HTML にできないページの紹介(見出し・紹介文・リンク) */
export function renderShell(path: string): string {
  setServerPath(path)
  return renderToStaticMarkup(<PageShell path={path} />)
}

/** OGP 画像に描く記事の情報(題名・分類・牌) */
export function articleOgInfo(): { slug: string; title: string; category: string; tiles: string }[] {
  return ARTICLES.map((a) => {
    const block = a.blocks.find((b) => b.type === 'tiles')
    const tiles = block && block.type === 'tiles' ? block.tiles : '123m406p789s1122z'
    return { slug: a.slug, title: a.meta.title, category: a.meta.category, tiles }
  })
}

/** 牌の絵(SVG の中身。1枚 60×80) */
export function tileArtMarkup(tiles: string): string[] {
  return parseTiles(tiles).map((t) => renderToStaticMarkup(<TileArt tile={t} />))
}

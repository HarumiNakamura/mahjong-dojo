import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// majiang-ai の古い版は legacy/index.js が require(`./player-${版}`) で読むため、ブラウザ用にまとめられない。
// 使う版のファイルを直接読み込めるように別名をつける(src/game/difficulty.ts)
const majiangLegacy = (version: string) => fileURLToPath(new URL(`./node_modules/@kobalab/majiang-ai/legacy/player-${version}.js`, import.meta.url))

// https://vite.dev/config/
// index.html の %SITE_TITLE%・%SITE_DESCRIPTION% を、src/config/site.ts と同じ決め方で埋める
// (ページごとの題名・説明は、ビルドの最後に scripts/prerender.mjs が入れ直す)
function siteHtml(): Plugin {
  let env: Record<string, string> = {}
  return {
    name: 'site-html',
    configResolved(config) {
      env = loadEnv(config.mode, process.cwd(), 'VITE_')
    },
    transformIndexHtml(html) {
      const name = `${env.VITE_SITE_NAME || '麻雀道場'}${env.VITE_SITE_PROVISIONAL === 'false' ? '' : '(仮)'}`
      return html
        .replace('%SITE_TITLE%', `${name} | 麻雀初心者のための練習サイト`)
        .replace('%SITE_DESCRIPTION%', '麻雀初心者のための練習サイト。牌効率・待ち・守備・押し引き・点数計算・配牌方針を、解説を読んですぐ手を動かしながら学べます。')
    },
  }
}

export default defineConfig({
  plugins: [react(), siteHtml()],
  resolve: {
    alias: { 'majiang-ai-legacy-0201': majiangLegacy('0201') },
  },
  // scripts/prerender.mjs が、ページごとに必要な CSS を調べるのに使う
  build: { manifest: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})

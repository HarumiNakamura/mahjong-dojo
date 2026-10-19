import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// majiang-ai の古い版は legacy/index.js が require(`./player-${版}`) で読むため、ブラウザ用にまとめられない。
// 使う版のファイルを直接読み込めるように別名をつける(src/game/difficulty.ts)
const majiangLegacy = (version: string) => fileURLToPath(new URL(`./node_modules/@kobalab/majiang-ai/legacy/player-${version}.js`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { 'majiang-ai-legacy-0201': majiangLegacy('0201') },
  },
  // scripts/prerender.mjs が、ページごとに必要な CSS を調べるのに使う
  build: { manifest: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})

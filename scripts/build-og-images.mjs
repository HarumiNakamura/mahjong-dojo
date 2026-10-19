// OGP 画像(public/og/<id>.png、1200×630)を作る
// 使い方: npm run build してから npm run build:og
// /dev/og/<id> の画面をプレビューサーバーで開き、Playwright(Chromium)で撮影する。

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let playwright
try {
  playwright = require('playwright')
} catch {
  // 開発環境に全体インストールされている Playwright を使う
  playwright = createRequire('/opt/node22/lib/node_modules/')('playwright')
}

const source = readFileSync(new URL('../src/app/ogp.ts', import.meta.url), 'utf8')
const ids = [...source.matchAll(/id: '([a-z0-9-]+)'/g)].map((m) => m[1])
const port = 4179
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' })

try {
  await new Promise((r) => setTimeout(r, 2500))
  const browser = await playwright.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' })
  for (const id of ids) {
    await page.goto(`http://localhost:${port}/dev/og/${id}`)
    await page.waitForSelector('[data-og-ready]')
    await page.screenshot({ path: `public/og/${id}.png`, clip: { x: 0, y: 0, width: 1200, height: 630 } })
    console.log(`public/og/${id}.png`)
  }
  await browser.close()
} finally {
  server.kill()
}

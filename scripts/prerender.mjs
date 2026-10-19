// ビルド後に、ページごとの HTML・サイトマップ・robots.txt を dist/ に書き出す
//
// 1. dist/index.html(vite build の結果)をひな形にする
// 2. ページごとに題名・説明・OGP・X カード・canonical を入れた HTML を作る
//    (記事など内容が毎回同じページは、本文まで HTML にする)
// 3. /foo は dist/foo.html に書く(Cloudflare は /foo で foo.html を返す)。見つからないページ用に 404.html も作る
// 使い方: npm run build の中で、vite build と SSR ビルド(dist-ssr/)のあとに実行される

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const DIST = 'dist'
const ssr = await import(pathToFileURL(join(process.cwd(), 'dist-ssr/entry-server.js')).href)
const template = readFileSync(join(DIST, 'index.html'), 'utf8')
const manifest = JSON.parse(readFileSync(join(DIST, '.vite/manifest.json'), 'utf8'))

/** 本文まで HTML にするページの、ページ部品のファイル(CSS を先に読み込むため) */
function pageModule(path) {
  if (path.startsWith('/learn/')) return 'src/pages/ArticlePage.tsx'
  const map = {
    '/learn': 'src/pages/LearnPage.tsx',
    '/about': 'src/pages/AboutPage.tsx',
    '/privacy': 'src/pages/site/PrivacyPage.tsx',
    '/contact': 'src/pages/site/ContactPage.tsx',
    '/disclaimer': 'src/pages/site/DisclaimerPage.tsx',
    '/practice': 'src/pages/PracticePage.tsx',
    '/practice/judgment': 'src/pages/JudgmentPage.tsx',
    '/score-table': 'src/pages/ScoreTablePage.tsx',
  }
  return map[path] ?? null
}

/** ページ部品と、それが読み込むファイルの CSS・JS */
function assetsOf(module) {
  const css = new Set()
  const js = new Set()
  const visit = (key) => {
    const entry = manifest[key]
    if (!entry || js.has(entry.file)) return
    js.add(entry.file)
    for (const c of entry.css ?? []) css.add(c)
    for (const i of entry.imports ?? []) visit(i)
  }
  if (module) visit(module)
  return { css: [...css], js: [...js] }
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function headFor(path, meta) {
  const url = `${ssr.SITE_URL}${path === '/' ? '/' : path}`
  const title = escape(ssr.fullTitle(meta))
  const description = escape(meta.description)
  const image = `${ssr.SITE_URL}${meta.image}`
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    meta.noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${escape(ssr.SITE_NAME)}" />`,
    `<meta property="og:type" content="${path.startsWith('/learn/') ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:locale" content="ja_JP" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ]
  const { css, js } = meta.prerenderBody ? assetsOf(pageModule(path)) : { css: [], js: [] }
  // ひな形にすでにある(サイト全体で使う)ファイルは入れない
  for (const c of css) if (!template.includes(`/${c}"`)) tags.push(`<link rel="stylesheet" href="/${c}" />`)
  for (const j of js) if (!template.includes(`/${j}"`)) tags.push(`<link rel="modulepreload" href="/${j}" />`)
  return tags.join('\n    ')
}

function page(path, meta, body) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `  ${headFor(path, meta)}\n  </head>`)
  if (body) html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

function write(file, text) {
  const target = join(DIST, file)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, text)
}

const paths = ssr.prerenderPaths()
for (const path of paths) {
  const meta = ssr.pageMeta(path)
  const body = meta.prerenderBody ? await ssr.render(path) : ''
  write(path === '/' ? 'index.html' : `${path.slice(1)}.html`, page(path, meta, body))
}
// 見つからないページ(Cloudflare が 404 の状態で返す)
write('404.html', page('/404', ssr.pageMeta('/404'), ''))

const today = new Date().toISOString().slice(0, 10)
const urls = ssr
  .sitemapPaths()
  .map((p) => `  <url><loc>${ssr.SITE_URL}${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
write('robots.txt', `User-agent: *\nDisallow: /dev/\nDisallow: /records/review/\n\nSitemap: ${ssr.SITE_URL}/sitemap.xml\n`)

rmSync('dist-ssr', { recursive: true, force: true })
console.log(`prerender: ${paths.length}ページ + 404.html・sitemap.xml・robots.txt`)

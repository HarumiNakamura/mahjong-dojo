import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Layout } from './Layout'

describe('Layout', () => {
  const html = renderToStaticMarkup(
    <Layout title="テスト">
      <button type="button">回答する</button>
    </Layout>,
  )

  it('メニューボタンとナビゲーションがある', () => {
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls="site-nav"')
    for (const label of ['ホーム', '練習', '牌効率', '解説', '学習記録', 'このサイトについて']) {
      expect(html).toContain(label)
    }
  })

  it('広告枠は本文(main)の外にあり、「広告」と表示する', () => {
    const mainEnd = html.indexOf('</main>')
    const ad = html.indexOf('class="ad-slot"')
    expect(ad).toBeGreaterThan(mainEnd)
    expect(html).toContain('>広告<')
    // 本文の中には広告枠がない
    expect(html.slice(html.indexOf('<main'), mainEnd)).not.toContain('ad-slot')
  })
})

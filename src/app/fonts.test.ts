import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { facesForText, parseFontFaces } from './fonts'

describe('フォントの読み込み', () => {
  const css = readFileSync('src/fonts.generated.css', 'utf8')
  const faces = parseFontFaces(css)

  it('生成した @font-face をすべて読める', () => {
    expect(faces.length).toBe((css.match(/@font-face/g) ?? []).length)
    expect(new Set(faces.map((f) => f.family))).toEqual(new Set(['BIZ UDPGothic', 'Shippori Mincho B1']))
    for (const f of faces) expect(f.ranges.length).toBeGreaterThan(0)
  })

  it('文字を含むフォントのファイルだけを選ぶ', () => {
    const picked = facesForText(faces, '麻雀')
    expect(picked.length).toBeGreaterThan(0)
    expect(picked.length).toBeLessThan(faces.length / 4)
    for (const f of picked) expect(f.ranges.some(([a, b]) => ['麻', '雀'].some((c) => c.codePointAt(0)! >= a && c.codePointAt(0)! <= b))).toBe(true)
    expect(facesForText(faces, '')).toEqual([])
  })

  it('unicode-range の範囲指定(U+0000-00FF)を読む', () => {
    const [f] = parseFontFaces("@font-face{font-family:'A';font-weight:400;src:url(a.woff2) format('woff2');unicode-range:U+0000-00ff,U+3042}")
    expect(f.ranges).toEqual([
      [0, 255],
      [0x3042, 0x3042],
    ])
    expect(facesForText([f], 'あ')).toHaveLength(1)
    expect(facesForText([f], 'い')).toHaveLength(0)
  })

  it('ビルド後の縮めた CSS(名前の引用符なし・data: の URL)も読める', () => {
    const [f, g] = parseFontFaces(
      '@font-face{font-family:BIZ UDPGothic;font-weight:700;src:url(/assets/a-1.woff2)format("woff2");unicode-range:U+FF02}' +
        '@font-face{font-family:Shippori Mincho B1;font-weight:800;src:url(data:font/woff2;base64,AAAA)format("woff2");unicode-range:U+5B57}',
    )
    expect(f).toMatchObject({ family: 'BIZ UDPGothic', weight: '700', url: '/assets/a-1.woff2' })
    expect(g).toMatchObject({ family: 'Shippori Mincho B1', url: 'data:font/woff2;base64,AAAA' })
  })
})

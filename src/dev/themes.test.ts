import { describe, expect, it } from 'vitest'
import { contrast, CONTRAST_PAIRS, THEMES, themeVars } from './themes'

describe('デザイン3案のトークン', () => {
  it('文字と背景のコントラストが WCAG AA 以上(ライト・ダークとも)', () => {
    const fails: string[] = []
    for (const t of THEMES) {
      for (const mode of ['light', 'dark'] as const) {
        const c = t.colors[mode]
        for (const p of CONTRAST_PAIRS) {
          const r = contrast(c[p.fg], c[p.bg])
          if (r < p.min) fails.push(`${t.name} ${mode}: ${p.fg} on ${p.bg} = ${r.toFixed(2)}(${p.min}以上が必要)`)
        }
      }
    }
    expect(fails).toEqual([])
  })

  it('生成り色の背景と深緑のアクセントの組み合わせは使わない', () => {
    for (const t of THEMES) {
      const c = t.colors.light
      expect(c.bg.toLowerCase(), t.name).not.toBe('#f6f4ee')
      expect(c.accent.toLowerCase(), t.name).not.toBe('#2f6b55')
    }
  })

  it('案の切り替えはトークンの差し替えだけ(どの案も同じ CSS 変数をすべて持つ)', () => {
    const keys = THEMES.map((t) => Object.keys(themeVars(t, 'light')).sort().join())
    expect(new Set(keys).size).toBe(1)
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21)
  })
})

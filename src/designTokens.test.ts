// デザイントークン(src/index.css)の、文字と背景のコントラストが WCAG AA 以上かを確かめる
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

/** :root { … } の中の --名前: #色; を読む */
function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]))
}

const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)')))
const dark = { ...light, ...tokens(css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))) }

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const PAIRS: [string, string, number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surface-2', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-2', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent-contrast', 'accent', 4.5],
  ['accent-contrast', 'accent-hover', 4.5],
  ['text', 'accent-soft', 4.5],
  ['header-text', 'header-bg', 4.5],
  ['text', 'scene', 4.5],
  ['correct', 'surface', 4.5],
  ['correct', 'correct-bg', 4.5],
  ['wrong', 'surface', 4.5],
  ['wrong', 'wrong-bg', 4.5],
  ['focus', 'surface', 3],
]

describe('デザイントークン(A 道場)', () => {
  for (const [name, t] of [
    ['ライト', light],
    ['ダーク', dark],
  ] as const) {
    it(`${name}: 文字と背景のコントラストが WCAG AA 以上`, () => {
      const fails = PAIRS.filter(([fg, bg, min]) => contrast(t[fg], t[bg]) < min).map(([fg, bg]) => `${fg} on ${bg}: ${contrast(t[fg], t[bg]).toFixed(2)}`)
      expect(fails).toEqual([])
    })
  }
})

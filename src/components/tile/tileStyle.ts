// 牌の見た目(文字の形・色・厚み)
import { shipporiMinchoB1 } from './glyphs.generated'

export const TILE_STYLE = {
  /** 文字の形(Shippori Mincho B1 の太字から変換) */
  glyphs: shipporiMinchoB1,
  /** 表面・ふち・側面(厚み)・影の色 */
  face: '#ffffff',
  edge: '#bdb7a8',
  side: '#d4cec0',
  shadow: 'rgba(0, 0, 0, 0.12)',
  /** 側面の厚み(牌の高さ80に対して) */
  depth: 2,
  /** 角の丸み */
  radius: 5,
  ink: '#141414',
  red: '#d0262c',
  green: '#13784a',
  blue: '#1c56a8',
} as const

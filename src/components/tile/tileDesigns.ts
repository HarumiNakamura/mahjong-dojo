// 牌のデザイン案。/dev/tiles で見比べて、選ばれた1つだけを残す予定。
import { shipporiMinchoB1, yujiSyuku, zenAntique, type Glyph, type GlyphChar } from './glyphs.generated'

export type TileDesignId = 'a' | 'b' | 'c'

export interface TileDesign {
  id: TileDesignId
  name: string
  /** 案の説明 */
  summary: string
  /** 文字の形 */
  glyphs: Record<GlyphChar, Glyph>
  /** 表面・ふち・側面(厚み)・影の色 */
  face: string
  edge: string
  side: string
  shadow: string
  /** 側面の厚み(牌の高さ80に対して) */
  depth: number
  /** 角の丸み */
  radius: number
  ink: string
  red: string
  green: string
  blue: string
  /** 赤5の印: 角の丸い点 / 角の三角 / ひし形 */
  redMark: 'dot' | 'corner' | 'diamond'
}

export const TILE_DESIGNS: Record<TileDesignId, TileDesign> = {
  a: {
    id: 'a',
    name: '案A 筆文字',
    summary: '筆で書いた楷書体(Yuji Syuku)。生成りの表面に、ベージュの控えめな厚み。赤5は右上に赤い丸印。',
    glyphs: yujiSyuku,
    face: '#fbf8f0',
    edge: '#cbbf9f',
    side: '#d9c9a0',
    shadow: 'rgba(60, 45, 20, 0.18)',
    depth: 4,
    radius: 6.5,
    ink: '#1c1c1c',
    red: '#c9252c',
    green: '#1d7a4c',
    blue: '#21539c',
    redMark: 'dot',
  },
  b: {
    id: 'b',
    name: '案B 古風な明朝',
    summary: '昔の活字のような明朝体(Zen Antique)。背はサイトの緑色で、本物の牌に近い雰囲気。赤5は右上の角が赤い三角。',
    glyphs: zenAntique,
    face: '#fdfaf2',
    edge: '#b9b29f',
    side: '#2f6b55',
    shadow: 'rgba(20, 50, 40, 0.2)',
    depth: 4.5,
    radius: 6.5,
    ink: '#181818',
    red: '#c62a2f',
    green: '#17734a',
    blue: '#1f4f99',
    redMark: 'corner',
  },
  c: {
    id: 'c',
    name: '案C 力強い明朝',
    summary: '太い明朝体(Shippori Mincho B1)。白い表面に薄い厚みで、すっきり平らな見た目。赤5は右上に赤いひし形。',
    glyphs: shipporiMinchoB1,
    face: '#ffffff',
    edge: '#bdb7a8',
    side: '#d4cec0',
    shadow: 'rgba(0, 0, 0, 0.12)',
    depth: 2,
    radius: 5,
    ink: '#141414',
    red: '#d0262c',
    green: '#13784a',
    blue: '#1c56a8',
    redMark: 'diamond',
  },
}

export const DEFAULT_TILE_DESIGN: TileDesignId = 'a'

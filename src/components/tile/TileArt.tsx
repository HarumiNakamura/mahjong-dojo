// 牌の絵柄(SVG)。文字はフォントから変換したパス(glyphs.generated.ts)で描くので、端末のフォントに左右されない。
// 座標系は横60×縦80。表面は (1.5,1.5)〜(58.5,74)、その下に側面(厚み)と影が少し見える。
// 小さく表示しても見分けやすいよう、太い図形と濃い色を使う。

import type { ReactElement } from 'react'
import { rankOf, suitOf, type Tile } from '../../engine/tiles'
import type { Glyph, GlyphChar } from './glyphs.generated'
import { TILE_STYLE as S } from './tileStyle'

export const TILE_W = 60
export const TILE_H = 80

const FACE = { x: 1.5, y: 1.5, w: 57, h: 72.5 }
/** 絵柄の中心 */
const CY = 38

const KANJI_NUMBERS: GlyphChar[] = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
/** 字牌の文字(白は文字ではなく枠で描く) */
const HONORS: (GlyphChar | null)[] = ['東', '南', '西', '北', null, '發', '中']

/** フォントから作った文字を、中心 (cx, cy)・大きさ size で描く */
function GlyphPath({ glyph, cx, cy, size, color }: { glyph: Glyph; cx: number; cy: number; size: number; color: string }) {
  const s = size / 100
  const tx = cx - (glyph.x + glyph.w / 2) * s
  const ty = cy - (glyph.y + glyph.h / 2) * s
  return <path d={glyph.d} fill={color} transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s})`} />
}

// ---- 萬子 ----

function Manzu({ rank, red }: { rank: number; red: boolean }) {
  return (
    <>
      <GlyphPath glyph={S.glyphs[KANJI_NUMBERS[rank - 1]]} cx={30} cy={22} size={27} color={red ? S.red : S.ink} />
      <GlyphPath glyph={S.glyphs['萬']} cx={30} cy={54} size={31} color={S.red} />
    </>
  )
}

// ---- 筒子 ----

type ColorKey = 'red' | 'green' | 'blue'
type Pin = [cx: number, cy: number, r: number, color: ColorKey]

function PinCircle({ cx, cy, r, color, face }: { cx: number; cy: number; r: number; color: string; face: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.6} fill={face} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={color} />
    </g>
  )
}

const PIN_LAYOUTS: Record<number, Pin[]> = {
  2: [
    [30, 23.5, 10.5, 'green'],
    [30, 52.5, 10.5, 'blue'],
  ],
  3: [
    [17, 19, 8.5, 'blue'],
    [30, 38, 8.5, 'red'],
    [43, 57, 8.5, 'green'],
  ],
  4: [
    [19.5, 25, 9, 'blue'],
    [40.5, 25, 9, 'green'],
    [19.5, 51, 9, 'green'],
    [40.5, 51, 9, 'blue'],
  ],
  5: [
    [18, 20, 8, 'blue'],
    [42, 20, 8, 'green'],
    [30, 38, 8, 'red'],
    [18, 56, 8, 'green'],
    [42, 56, 8, 'blue'],
  ],
  6: [
    [20, 16.5, 7.5, 'green'],
    [40, 16.5, 7.5, 'green'],
    [20, 38, 7.5, 'red'],
    [40, 38, 7.5, 'red'],
    [20, 59.5, 7.5, 'red'],
    [40, 59.5, 7.5, 'red'],
  ],
  7: [
    [15, 14.5, 6, 'green'],
    [30, 20.5, 6, 'green'],
    [45, 26.5, 6, 'green'],
    [20, 44, 7, 'red'],
    [40, 44, 7, 'red'],
    [20, 61, 7, 'red'],
    [40, 61, 7, 'red'],
  ],
  8: [
    [20, 15, 6.5, 'blue'],
    [40, 15, 6.5, 'blue'],
    [20, 30.5, 6.5, 'blue'],
    [40, 30.5, 6.5, 'blue'],
    [20, 46, 6.5, 'blue'],
    [40, 46, 6.5, 'blue'],
    [20, 61.5, 6.5, 'blue'],
    [40, 61.5, 6.5, 'blue'],
  ],
  9: [
    [16, 17, 7, 'blue'],
    [30, 17, 7, 'blue'],
    [44, 17, 7, 'blue'],
    [16, 38, 7, 'red'],
    [30, 38, 7, 'red'],
    [44, 38, 7, 'red'],
    [16, 59, 7, 'green'],
    [30, 59, 7, 'green'],
    [44, 59, 7, 'green'],
  ],
}

function Pinzu({ rank, red }: { rank: number; red: boolean }) {
  if (rank === 1) {
    // 一筒は大きな花のような円
    return (
      <g>
        <circle cx={30} cy={CY} r={21} fill={S.green} />
        <circle cx={30} cy={CY} r={17.5} fill={S.face} />
        <circle cx={30} cy={CY} r={14} fill={S.blue} />
        <circle cx={30} cy={CY} r={9} fill={S.face} />
        <circle cx={30} cy={CY} r={5.5} fill={S.red} />
      </g>
    )
  }
  return (
    <>
      {PIN_LAYOUTS[rank].map(([cx, cy, r, color], i) => (
        <PinCircle key={i} cx={cx} cy={cy} r={r} color={red ? S.red : S[color]} face={S.face} />
      ))}
    </>
  )
}

// ---- 索子 ----

type Stick = [cx: number, cy: number, len: number, color: ColorKey, angle?: number]

function BambooStick({ cx, cy, len, color, face, angle = 0 }: { cx: number; cy: number; len: number; color: string; face: string; angle?: number }) {
  const w = 6
  return (
    <g transform={angle ? `rotate(${angle} ${cx} ${cy})` : undefined}>
      <rect x={cx - w / 2} y={cy - len / 2} width={w} height={len} rx={w / 2} fill={color} />
      {/* 竹の節 */}
      <rect x={cx - w / 2} y={cy - 0.8} width={w} height={1.6} fill={face} />
      <rect x={cx - 0.9} y={cy - len / 2 + 3} width={1.8} height={len / 2 - 5} rx={0.9} fill={face} opacity={0.45} />
    </g>
  )
}

const SOU_LAYOUTS: Record<number, Stick[]> = {
  2: [
    [30, 24, 23, 'green'],
    [30, 52, 23, 'green'],
  ],
  3: [
    [30, 24, 23, 'green'],
    [20.5, 52, 23, 'green'],
    [39.5, 52, 23, 'green'],
  ],
  4: [
    [21, 24, 23, 'green'],
    [39, 24, 23, 'green'],
    [21, 52, 23, 'green'],
    [39, 52, 23, 'green'],
  ],
  5: [
    [17.5, 24, 23, 'green'],
    [42.5, 24, 23, 'green'],
    [30, 38, 23, 'red'],
    [17.5, 52, 23, 'green'],
    [42.5, 52, 23, 'green'],
  ],
  6: [
    [17.5, 24, 23, 'green'],
    [30, 24, 23, 'green'],
    [42.5, 24, 23, 'green'],
    [17.5, 52, 23, 'green'],
    [30, 52, 23, 'green'],
    [42.5, 52, 23, 'green'],
  ],
  7: [
    [30, 16, 15, 'red'],
    [17.5, 38.5, 16, 'green'],
    [30, 38.5, 16, 'green'],
    [42.5, 38.5, 16, 'green'],
    [17.5, 58.5, 16, 'green'],
    [30, 58.5, 16, 'green'],
    [42.5, 58.5, 16, 'green'],
  ],
  8: [
    [14, 24, 23, 'green', 16],
    [24.5, 24, 23, 'green', -16],
    [35.5, 24, 23, 'green', 16],
    [46, 24, 23, 'green', -16],
    [14, 52, 23, 'green', -16],
    [24.5, 52, 23, 'green', 16],
    [35.5, 52, 23, 'green', -16],
    [46, 52, 23, 'green', 16],
  ],
  9: [
    [17.5, 17, 16, 'green'],
    [30, 17, 16, 'red'],
    [42.5, 17, 16, 'green'],
    [17.5, 38, 16, 'green'],
    [30, 38, 16, 'red'],
    [42.5, 38, 16, 'green'],
    [17.5, 59, 16, 'green'],
    [30, 59, 16, 'red'],
    [42.5, 59, 16, 'green'],
  ],
}

function Bird() {
  // 一索は鳥
  return (
    <g transform="translate(0 1)">
      <path d="M22 44 L7 54 L11 58 L21 51 L9 63 L14 66 L24 54 Z" fill={S.blue} />
      <ellipse cx={30} cy={43} rx={13} ry={11} fill={S.green} />
      <path d="M22 41 Q31 33 39 41 Q31 47 22 41 Z" fill={S.face} opacity={0.35} />
      <circle cx={40} cy={26} r={7.5} fill={S.green} />
      <circle cx={38} cy={17} r={3.2} fill={S.red} />
      <circle cx={42} cy={25} r={1.8} fill={S.face} />
      <path d="M46.5 24 L54 27.5 L46.5 30 Z" fill={S.red} />
      <path d="M34 34 L37 32" stroke={S.green} strokeWidth={5} />
      <path d="M27 53 L25 63 M34 53 L36 63" stroke={S.red} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  )
}

function Souzu({ rank, red }: { rank: number; red: boolean }) {
  if (rank === 1) return <Bird />
  return (
    <>
      {SOU_LAYOUTS[rank].map(([cx, cy, len, color, angle], i) => (
        <BambooStick key={i} cx={cx} cy={cy} len={len} color={red ? S.red : S[color]} face={S.face} angle={angle} />
      ))}
    </>
  )
}

// ---- 字牌 ----

function Honor({ rank }: { rank: number }) {
  // 白は何も描かない
  if (rank === 5) return null
  const color = rank === 6 ? S.green : rank === 7 ? S.red : S.ink
  return <GlyphPath glyph={S.glyphs[HONORS[rank - 1]!]} cx={30} cy={CY} size={43} color={color} />
}

// ---- 赤5の印 ----

/** 赤5は右上に赤いひし形の印を付け、小さく表示しても普通の5と見分けられるようにする */
function RedMark() {
  const right = FACE.x + FACE.w
  const top = FACE.y
  return <path d={`M${right - 7.5} ${top + 2} L${right - 2.5} ${top + 7.5} L${right - 7.5} ${top + 13} L${right - 12.5} ${top + 7.5} Z`} fill={S.red} />
}

/** 牌の表面の絵柄(座標系 60×80 の <g>)。 */
export function TileArt({ tile }: { tile: Tile }): ReactElement {
  const suit = suitOf(tile.kind)
  const rank = rankOf(tile.kind)
  let body: ReactElement | null
  if (suit === 'm') body = <Manzu rank={rank} red={tile.red} />
  else if (suit === 'p') body = <Pinzu rank={rank} red={tile.red} />
  else if (suit === 's') body = <Souzu rank={rank} red={tile.red} />
  else body = <Honor rank={rank} />
  const { x, y, w, h } = FACE
  const r = S.radius
  return (
    <g>
      {/* 影と側面(厚み)は控えめに */}
      <rect x={x} y={y + 4 + 1} width={w} height={h - 4 + S.depth} rx={r} fill={S.shadow} />
      <rect x={x} y={y + 4} width={w} height={h - 4 + S.depth} rx={r} fill={S.side} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={S.face} stroke={S.edge} strokeWidth={1} />
      {body}
      {tile.red && <RedMark />}
    </g>
  )
}

// 牌の絵柄(SVG)。既存の画像は使わず図形で描く。
// 座標系は横60×縦80。表面は (2,2)〜(58,72)、下の4pxは牌の背(緑)が見える。
// 小さく表示しても見分けやすいよう、太い図形と濃い色を使う。

import type { ReactElement } from 'react'
import { rankOf, suitOf, type Tile } from '../../engine/tiles'

export const TILE_W = 60
export const TILE_H = 80

const COLOR = {
  face: '#fdfbf3',
  edge: '#a69f8c',
  back: '#2e8b66',
  ink: '#1b1b1b',
  red: '#d6262b',
  green: '#16824a',
  blue: '#1d5bb0',
}

const FONT = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',Meiryo,sans-serif"

const KANJI_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const HONORS = ['東', '南', '西', '北', '白', '發', '中']

function Glyph({ x, y, size, color, children }: { x: number; y: number; size: number; color: string; children: string }) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontFamily={FONT}
      fontWeight={700}
      fill={color}
      textAnchor="middle"
      dominantBaseline="central"
    >
      {children}
    </text>
  )
}

// ---- 萬子 ----

function Manzu({ rank, red }: { rank: number; red: boolean }) {
  return (
    <>
      <Glyph x={30} y={22} size={25} color={red ? COLOR.red : COLOR.ink}>
        {KANJI_NUMBERS[rank - 1]}
      </Glyph>
      <Glyph x={30} y={53} size={27} color={COLOR.red}>
        萬
      </Glyph>
    </>
  )
}

// ---- 筒子 ----

type Pin = [cx: number, cy: number, r: number, color: string]

function PinCircle({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={COLOR.face} />
      <circle cx={cx} cy={cy} r={r * 0.34} fill={color} />
    </g>
  )
}

const { red: R, green: G, blue: B } = COLOR

const PIN_LAYOUTS: Record<number, Pin[]> = {
  2: [
    [30, 22, 11, G],
    [30, 52, 11, B],
  ],
  3: [
    [16, 17, 9, B],
    [30, 37, 9, R],
    [44, 57, 9, G],
  ],
  4: [
    [18, 22, 10, B],
    [42, 22, 10, G],
    [18, 52, 10, G],
    [42, 52, 10, B],
  ],
  5: [
    [17, 18, 9, B],
    [43, 18, 9, G],
    [30, 37, 9, R],
    [17, 56, 9, G],
    [43, 56, 9, B],
  ],
  6: [
    [19, 15, 8, G],
    [41, 15, 8, G],
    [19, 38, 8, R],
    [41, 38, 8, R],
    [19, 59, 8, R],
    [41, 59, 8, R],
  ],
  7: [
    [14, 13, 6.5, G],
    [30, 20, 6.5, G],
    [46, 27, 6.5, G],
    [19, 43, 7.5, R],
    [41, 43, 7.5, R],
    [19, 61, 7.5, R],
    [41, 61, 7.5, R],
  ],
  8: [
    [19, 14, 7, B],
    [41, 14, 7, B],
    [19, 30, 7, B],
    [41, 30, 7, B],
    [19, 46, 7, B],
    [41, 46, 7, B],
    [19, 62, 7, B],
    [41, 62, 7, B],
  ],
  9: [
    [15, 17, 7.5, B],
    [30, 17, 7.5, B],
    [45, 17, 7.5, B],
    [15, 37, 7.5, R],
    [30, 37, 7.5, R],
    [45, 37, 7.5, R],
    [15, 57, 7.5, G],
    [30, 57, 7.5, G],
    [45, 57, 7.5, G],
  ],
}

function Pinzu({ rank, red }: { rank: number; red: boolean }) {
  if (rank === 1) {
    // 一筒は大きな花のような円
    return (
      <g>
        <circle cx={30} cy={37} r={22} fill={COLOR.green} />
        <circle cx={30} cy={37} r={17} fill={COLOR.face} />
        <circle cx={30} cy={37} r={13} fill={COLOR.blue} />
        <circle cx={30} cy={37} r={8} fill={COLOR.face} />
        <circle cx={30} cy={37} r={5} fill={COLOR.red} />
      </g>
    )
  }
  return (
    <>
      {PIN_LAYOUTS[rank].map(([cx, cy, r, color], i) => (
        <PinCircle key={i} cx={cx} cy={cy} r={r} color={red ? COLOR.red : color} />
      ))}
    </>
  )
}

// ---- 索子 ----

type Stick = [cx: number, cy: number, len: number, color: string, angle?: number]

function BambooStick({ cx, cy, len, color, angle = 0 }: { cx: number; cy: number; len: number; color: string; angle?: number }) {
  const w = 6.5
  return (
    <g transform={angle ? `rotate(${angle} ${cx} ${cy})` : undefined}>
      <rect x={cx - w / 2} y={cy - len / 2} width={w} height={len} rx={w / 2} fill={color} />
      <rect x={cx - w / 2} y={cy - 0.9} width={w} height={1.8} fill={COLOR.face} />
    </g>
  )
}

const SOU_LAYOUTS: Record<number, Stick[]> = {
  2: [
    [30, 22, 24, G],
    [30, 52, 24, G],
  ],
  3: [
    [30, 22, 24, G],
    [20, 52, 24, G],
    [40, 52, 24, G],
  ],
  4: [
    [20, 22, 24, G],
    [40, 22, 24, G],
    [20, 52, 24, G],
    [40, 52, 24, G],
  ],
  5: [
    [16, 22, 24, G],
    [44, 22, 24, G],
    [30, 37, 24, R],
    [16, 52, 24, G],
    [44, 52, 24, G],
  ],
  6: [
    [16, 22, 24, G],
    [30, 22, 24, G],
    [44, 22, 24, G],
    [16, 52, 24, B],
    [30, 52, 24, B],
    [44, 52, 24, B],
  ],
  7: [
    [30, 15, 16, R],
    [16, 38, 17, G],
    [30, 38, 17, G],
    [44, 38, 17, G],
    [16, 58, 17, G],
    [30, 58, 17, G],
    [44, 58, 17, G],
  ],
  8: [
    [13, 22, 24, G, 18],
    [24, 22, 24, G, -18],
    [36, 22, 24, G, 18],
    [47, 22, 24, G, -18],
    [13, 52, 24, B, -18],
    [24, 52, 24, B, 18],
    [36, 52, 24, B, -18],
    [47, 52, 24, B, 18],
  ],
  9: [
    [16, 16, 17, G],
    [30, 16, 17, R],
    [44, 16, 17, G],
    [16, 37, 17, G],
    [30, 37, 17, R],
    [44, 37, 17, G],
    [16, 58, 17, G],
    [30, 58, 17, R],
    [44, 58, 17, G],
  ],
}

function Bird() {
  // 一索は鳥
  return (
    <g>
      <path d="M22 44 L7 54 L11 58 L21 51 L9 63 L14 66 L24 54 Z" fill={COLOR.blue} />
      <ellipse cx={30} cy={43} rx={13} ry={11} fill={COLOR.green} />
      <path d="M22 41 Q31 33 39 41 Q31 47 22 41 Z" fill="#0f5f35" />
      <circle cx={40} cy={26} r={7.5} fill={COLOR.green} />
      <circle cx={38} cy={17} r={3.2} fill={COLOR.red} />
      <circle cx={42} cy={25} r={1.8} fill={COLOR.face} />
      <path d="M46.5 24 L54 27.5 L46.5 30 Z" fill={COLOR.red} />
      <path d="M34 34 L37 32" stroke={COLOR.green} strokeWidth={5} />
      <path d="M27 53 L25 63 M34 53 L36 63" stroke={COLOR.red} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  )
}

function Souzu({ rank, red }: { rank: number; red: boolean }) {
  if (rank === 1) return <Bird />
  return (
    <>
      {SOU_LAYOUTS[rank].map(([cx, cy, len, color, angle], i) => (
        <BambooStick key={i} cx={cx} cy={cy} len={len} color={red ? COLOR.red : color} angle={angle} />
      ))}
    </>
  )
}

// ---- 字牌 ----

function Honor({ rank }: { rank: number }) {
  if (rank === 5) {
    // 白は青い枠だけ(何もない牌と区別するため)
    return <rect x={13} y={14} width={34} height={46} rx={3} fill="none" stroke={COLOR.blue} strokeWidth={3} />
  }
  const color = rank === 6 ? COLOR.green : rank === 7 ? COLOR.red : COLOR.ink
  return (
    <Glyph x={30} y={38} size={38} color={color}>
      {HONORS[rank - 1]}
    </Glyph>
  )
}

/** 牌の表面の絵柄(座標系 60×80 の <g>)。 */
export function TileArt({ tile }: { tile: Tile }): ReactElement {
  const suit = suitOf(tile.kind)
  const rank = rankOf(tile.kind)
  let body: ReactElement
  if (suit === 'm') body = <Manzu rank={rank} red={tile.red} />
  else if (suit === 'p') body = <Pinzu rank={rank} red={tile.red} />
  else if (suit === 's') body = <Souzu rank={rank} red={tile.red} />
  else body = <Honor rank={rank} />
  return (
    <g>
      <rect x={1} y={1} width={58} height={78} rx={7} fill={COLOR.back} />
      <rect x={1.5} y={1.5} width={57} height={71.5} rx={6.5} fill={COLOR.face} stroke={COLOR.edge} strokeWidth={1.2} />
      {body}
    </g>
  )
}

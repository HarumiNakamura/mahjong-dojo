// 図解の共通部品(SVG の中に置く牌・矢印・文字)。色は CSS 変数(figures.css のクラス)で付ける
import type { ReactNode } from 'react'
import { parseTiles } from '../../engine/tiles'
import { TILE_H, TILE_W, TileArt } from '../tile/TileArt'
import { TILE_RATIO } from './geometry'

/** SVG の中の牌1枚(左上の位置と幅を指定) */
export function FigTile({ tile, x, y, w = 36, faded = false }: { tile: string; x: number; y: number; w?: number; faded?: boolean }) {
  const t = parseTiles(tile)[0]
  return (
    <svg x={x} y={y} width={w} height={w * TILE_RATIO} viewBox={`0 0 ${TILE_W} ${TILE_H}`} opacity={faded ? 0.35 : 1}>
      <TileArt tile={t} />
    </svg>
  )
}

/** 横に並んだ牌(間をあけずに並べる) */
export function FigTiles({ tiles, x, y, w = 36, gap = 0 }: { tiles: string; x: number; y: number; w?: number; gap?: number }) {
  const list = parseTiles(tiles)
  return (
    <g>
      {list.map((t, i) => (
        <svg key={i} x={x + i * (w + gap)} y={y} width={w} height={w * TILE_RATIO} viewBox={`0 0 ${TILE_W} ${TILE_H}`}>
          <TileArt tile={t} />
        </svg>
      ))}
    </g>
  )
}

type TextTone = 'text' | 'muted' | 'accent' | 'correct' | 'contrast'

/** 文字(既定は中央ぞろえ・14px) */
export function FigText({
  x,
  y,
  children,
  size = 14,
  tone = 'text',
  anchor = 'middle',
  bold = false,
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  tone?: TextTone
  anchor?: 'start' | 'middle' | 'end'
  bold?: boolean
}) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} className={`fig-t fig-t--${tone}`} fontWeight={bold ? 700 : 400}>
      {children}
    </text>
  )
}

/** 矢印の先端(marker)。図ごとに1つ <defs> に置き、useArrowId の url を markerEnd に渡す */
export function ArrowHead({ id }: { id: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 Z" className="fig-fill-text" />
    </marker>
  )
}

/** バツ印(消えた形に重ねる) */
export function FigCross({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g className="fig-cross">
      <line x1={x} y1={y} x2={x + w} y2={y + h} />
      <line x1={x + w} y1={y} x2={x} y2={y + h} />
    </g>
  )
}

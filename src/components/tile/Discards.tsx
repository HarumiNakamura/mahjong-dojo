import type { Tile as TileData } from '../../engine/tiles'
import { Tile } from './Tile'

interface DiscardsProps {
  tiles: readonly TileData[]
  /** リーチ宣言牌の位置(横向きに置く) */
  riichiIndex?: number | null
  /** 目立たせる牌の位置(解説で根拠の牌を示す) */
  highlight?: ReadonlySet<number>
}

const PER_ROW = 6

/** 河(捨て牌)。6枚ごとに改行し、リーチ宣言牌は横向きにする。 */
export function Discards({ tiles, riichiIndex = null, highlight }: DiscardsProps) {
  const rows: number[][] = []
  for (let i = 0; i < tiles.length; i += PER_ROW) {
    rows.push(Array.from({ length: Math.min(PER_ROW, tiles.length - i) }, (_, j) => i + j))
  }
  return (
    <div className="discards" aria-label="河">
      {rows.map((row, r) => (
        <div key={r} className="discards-row">
          {row.map((i) =>
            highlight?.has(i) ? (
              <span key={i} className="discards-highlight">
                <Tile tile={tiles[i]} sideways={i === riichiIndex} />
              </span>
            ) : (
              <Tile key={i} tile={tiles[i]} sideways={i === riichiIndex} />
            ),
          )}
        </div>
      ))}
    </div>
  )
}

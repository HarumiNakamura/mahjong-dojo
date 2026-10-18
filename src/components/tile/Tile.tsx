import { tileName, type Tile as TileData } from '../../engine/tiles'
import { TILE_H, TILE_W, TileArt } from './TileArt'
import { useTileSettings } from './tileSettings'
import './tile.css'

interface TileProps {
  tile: TileData
  /** 横向き(リーチ宣言牌など) */
  sideways?: boolean
  /** 数字表示の設定を上書きする */
  showLabel?: boolean
}

/** 牌1枚。幅は親要素の CSS 変数 --tile-w で決まる。 */
export function Tile({ tile, sideways = false, showLabel }: TileProps) {
  const settings = useTileSettings()
  const label = showLabel ?? settings.showLabel
  const name = tileName(tile)
  return (
    <span className={`tile${sideways ? ' tile--sideways' : ''}`}>
      <svg
        className="tile-svg"
        viewBox={sideways ? `0 0 ${TILE_H} ${TILE_W}` : `0 0 ${TILE_W} ${TILE_H}`}
        role="img"
        aria-label={name}
      >
        {sideways ? (
          <g transform={`translate(${TILE_H} 0) rotate(90)`}>
            <TileArt tile={tile} />
          </g>
        ) : (
          <TileArt tile={tile} />
        )}
      </svg>
      {label && (
        <span className={`tile-label${tile.red ? ' tile-label--red' : ''}`} aria-hidden="true">
          {name.replace('赤', '')}
        </span>
      )}
    </span>
  )
}

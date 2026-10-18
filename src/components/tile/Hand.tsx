import { tileName, type Tile as TileData } from '../../engine/tiles'
import { Tile } from './Tile'

interface HandProps {
  tiles: readonly TileData[]
  /** ツモ牌(少し離して右端に置く) */
  drawn?: TileData | null
  /** 選択中の位置(ツモ牌は tiles.length) */
  selected?: number | null
  /** 指定するとタップで選択できる */
  onSelect?: (index: number) => void
}

/** 手牌。13〜14枚を横一列に並べ、画面幅に合わせて牌の大きさを変える。 */
export function Hand({ tiles, drawn, selected = null, onSelect }: HandProps) {
  const all = drawn ? [...tiles, drawn] : [...tiles]
  return (
    <div className="hand" role={onSelect ? 'group' : undefined} aria-label="手牌">
      {all.map((tile, i) => {
        const isDrawn = drawn != null && i === tiles.length
        const className = `hand-tile${isDrawn ? ' hand-tile--drawn' : ''}${selected === i ? ' hand-tile--selected' : ''}`
        if (!onSelect) {
          return (
            <span key={i} className={className}>
              <Tile tile={tile} />
            </span>
          )
        }
        return (
          <button
            key={i}
            type="button"
            className={className}
            aria-pressed={selected === i}
            aria-label={`${tileName(tile)}${isDrawn ? '(ツモ牌)' : ''}`}
            onClick={() => onSelect(i)}
          >
            <Tile tile={tile} />
          </button>
        )
      })}
    </div>
  )
}

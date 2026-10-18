import { ALL_KINDS, suitOf, type Suit } from '../../engine/tiles'
import type { UkeireTile } from '../../engine/ukeire'
import { Tile } from './Tile'

const SUITS: Suit[] = ['m', 'p', 's', 'z']

/** 34種の牌を並べ、有効牌だけを光らせて残り枚数を出す */
export function UkeireBoard({ tiles }: { tiles: readonly UkeireTile[] }) {
  const remaining = new Map(tiles.map((t) => [t.kind, t.remaining]))
  return (
    <div className="ukeire-board" aria-label="有効牌の一覧">
      {SUITS.map((suit) => (
        <div key={suit} className="ukeire-board-row">
          {ALL_KINDS.filter((k) => suitOf(k) === suit).map((kind) => {
            const n = remaining.get(kind)
            const active = n !== undefined
            return (
              <span key={kind} className={`ukeire-cell${active ? ' ukeire-cell--active' : ''}`}>
                <Tile tile={{ kind, red: false }} showLabel={false} />
                <span className="ukeire-count" aria-hidden={!active}>
                  {active ? `${n}枚` : ''}
                </span>
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

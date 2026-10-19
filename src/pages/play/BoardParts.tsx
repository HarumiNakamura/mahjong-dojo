// 対局画面と牌譜の再生で使う、盤面の部品

import { Tile } from '../../components/tile/Tile'
import { meldView, riverTile } from '../../game/convert'

/** 面子(副露)を小さく並べる。鳴いた牌は横向き */
export function MeldTiles({ m, size }: { m: string; size?: 'small' }) {
  const { tiles, called } = meldView(m)
  return (
    <span className={`play-meld${size === 'small' ? ' play-meld--small' : ''}`}>
      {tiles.map((t, i) => (
        <Tile key={i} tile={t} sideways={i === called} showLabel={false} />
      ))}
    </span>
  )
}

/** 河。6枚ごとに改行し、リーチ宣言牌は横向き、鳴かれた牌は薄く */
export function River({ pai, large }: { pai: readonly string[]; large: boolean }) {
  const rows: string[][] = []
  for (let i = 0; i < pai.length; i += 6) rows.push(pai.slice(i, i + 6))
  return (
    <div className={`play-river${large ? ' play-river--large' : ''}`}>
      {rows.map((row, r) => (
        <div key={r} className="play-river-row">
          {row.map((p, i) => {
            const t = riverTile(p)
            return (
              <span key={i} className={`play-river-tile${t.called ? ' play-river-tile--called' : ''}`}>
                <Tile tile={t.tile} sideways={t.lizhi} showLabel={false} />
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}


import { useState } from 'react'
import { ALL_KINDS, formatTiles, parseTiles, RED_FIVES, sortTiles, suitOf, tileName } from '../engine/tiles'
import { Discards } from '../components/tile/Discards'
import { Hand } from '../components/tile/Hand'
import { Tile } from '../components/tile/Tile'
import { useTileSettings } from '../components/tile/tileSettings'
import { TileDesignContext } from '../components/tile/tileDesignContext'
import { TILE_DESIGNS } from '../components/tile/tileDesigns'
import './DevTilesPage.css'

const SUIT_ROWS = [
  { suit: 'm', title: '萬子(マンズ)' },
  { suit: 'p', title: '筒子(ピンズ)' },
  { suit: 's', title: '索子(ソーズ)' },
  { suit: 'z', title: '字牌(東南西北白發中)' },
] as const

const FIVES = parseTiles('50m50p50s')
const SAMPLE_HAND = parseTiles('3m71p406s2m95s1z8p6z3m')
const SAMPLE_DRAWN = parseTiles('7z')[0]
const SAMPLE_DISCARDS = parseTiles('1z9m4z1p8s2z5m7p3s9p6z1s4m')

/** 動作確認用ページ: 全牌と手牌・河の表示例 */
export function DevTilesPage() {
  const { showLabel, setShowLabel } = useTileSettings()
  const [sorted, setSorted] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  const hand = sorted ? sortTiles(SAMPLE_HAND) : SAMPLE_HAND
  const all = [...hand, SAMPLE_DRAWN]

  return (
    <main className="dev-tiles">
      <h1>牌の表示確認</h1>
      <p className="dev-tiles-note">開発用のページです。</p>

      <label className="dev-tiles-toggle">
        <input type="checkbox" checked={showLabel} onChange={(e) => setShowLabel(e.target.checked)} />
        牌の下に数字を表示する(初心者向け)
      </label>

      <section>
        <h2>デザイン案の比較</h2>
        <p className="dev-tiles-note">3つの案を見比べて、1つを選んでください。選ばれなかった案は削除します。</p>
        {Object.values(TILE_DESIGNS).map((design) => (
          <TileDesignContext.Provider key={design.id} value={design.id}>
            <div className="dev-design">
              <h3 className="dev-design-title">{design.name}</h3>
              <p className="dev-tiles-note">{design.summary}</p>
              {SUIT_ROWS.map(({ suit }) => (
                <div key={suit} className="dev-tiles-row dev-design-row">
                  {ALL_KINDS.filter((k) => suitOf(k) === suit).map((kind) => (
                    <Tile key={kind} tile={{ kind, red: false }} />
                  ))}
                </div>
              ))}
              <p className="dev-design-caption">普通の5と赤5(小さいサイズ・普通のサイズ)</p>
              {[24, 34].map((w) => (
                <div key={w} className="dev-tiles-row dev-design-row" style={{ ['--tile-w' as string]: `${w}px` }}>
                  {FIVES.map((t, i) => (
                    <Tile key={i} tile={t} />
                  ))}
                </div>
              ))}
              <p className="dev-design-caption">手牌の大きさ</p>
              <Hand tiles={SAMPLE_HAND} drawn={SAMPLE_DRAWN} />
            </div>
          </TileDesignContext.Provider>
        ))}
      </section>

      <section>
        <h2>全34種(案A)</h2>
        {SUIT_ROWS.map(({ suit, title }) => (
          <div key={suit} className="dev-tiles-group">
            <h3>{title}</h3>
            <div className="dev-tiles-row">
              {ALL_KINDS.filter((k) => suitOf(k) === suit).map((kind) => (
                <Tile key={kind} tile={{ kind, red: false }} />
              ))}
            </div>
          </div>
        ))}
        <div className="dev-tiles-group">
          <h3>赤5(赤ドラ)</h3>
          <div className="dev-tiles-row">
            {RED_FIVES.map((t) => (
              <Tile key={t.kind} tile={t} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2>手牌(タップで選択)</h2>
        <Hand
          tiles={hand}
          drawn={SAMPLE_DRAWN}
          selected={selected}
          onSelect={(i) => setSelected(i === selected ? null : i)}
        />
        <p className="dev-tiles-status">
          選択中: {selected === null ? 'なし' : tileName(all[selected])}
        </p>
        <p className="dev-tiles-status">
          表記: <code>{formatTiles(hand)}</code> + ツモ <code>{formatTiles([SAMPLE_DRAWN])}</code>
        </p>
        <button
          type="button"
          className="dev-tiles-button"
          onClick={() => {
            setSorted(!sorted)
            setSelected(null)
          }}
        >
          {sorted ? '元の並びに戻す' : '理牌する'}
        </button>
      </section>

      <section>
        <h2>河(6枚で改行・リーチ宣言牌は横向き)</h2>
        <Discards tiles={SAMPLE_DISCARDS} riichiIndex={7} />
      </section>

      <section>
        <h2>大きさの例</h2>
        <div className="dev-tiles-row dev-tiles-sizes">
          {[24, 32, 48, 64].map((w) => (
            <span key={w} style={{ ['--tile-w' as string]: `${w}px` }}>
              <Tile tile={parseTiles('0p')[0]} />
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}

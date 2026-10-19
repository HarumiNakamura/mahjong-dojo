import { OG_CARDS } from '../app/ogp'
import { Hand } from '../components/tile/Hand'
import { parseTiles } from '../engine/tiles'
import './pages.css'

/** OGP 画像の元になる画面(1200×630 で撮影する。開発用) */
export function DevOgPage({ id }: { id: string }) {
  const card = OG_CARDS.find((c) => c.id === id) ?? OG_CARDS[0]
  return (
    <div className="og-card" data-og-ready="true">
      <p className="og-site">麻雀道場(仮)</p>
      <p className="og-title">{card.title}</p>
      <p className="og-text">{card.text}</p>
      <div className="og-hand">
        <Hand tiles={parseTiles(card.tiles)} />
      </div>
    </div>
  )
}

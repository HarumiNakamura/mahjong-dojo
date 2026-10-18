import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ALL_KINDS, parseTiles, RED_FIVES, tileName } from '../../engine/tiles'
import { Discards } from './Discards'
import { Hand } from './Hand'
import { Tile } from './Tile'
import { TileArt } from './TileArt'

describe('Tile', () => {
  it('34種と赤5をすべて描画でき、牌名が読み上げ用に付く', () => {
    const tiles = [...ALL_KINDS.map((kind) => ({ kind, red: false })), ...RED_FIVES]
    for (const tile of tiles) {
      const html = renderToStaticMarkup(<Tile tile={tile} />)
      expect(html).toContain(`aria-label="${tileName(tile)}"`)
    }
  })

  it('設定で牌の下に数字を表示できる', () => {
    const tile = parseTiles('0p')[0]
    expect(renderToStaticMarkup(<Tile tile={tile} />)).not.toContain('tile-label')
    expect(renderToStaticMarkup(<Tile tile={tile} showLabel />)).toContain('>5筒</span>')
  })
})

describe('Hand', () => {
  it('タップ可能なら牌ごとにボタンになり、ツモ牌は離して置く', () => {
    const html = renderToStaticMarkup(
      <Hand tiles={parseTiles('1234567890123m')} drawn={parseTiles('1z')[0]} selected={2} onSelect={() => {}} />,
    )
    expect(html.match(/<button/g)).toHaveLength(14)
    expect(html.match(/hand-tile--drawn/g)).toHaveLength(1)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
  })
})

describe('Discards', () => {
  it('6枚ごとに改行し、リーチ宣言牌だけ横向き', () => {
    const html = renderToStaticMarkup(<Discards tiles={parseTiles('123456789m1234z')} riichiIndex={7} />)
    expect(html.match(/discards-row/g)).toHaveLength(3)
    expect(html.match(/tile--sideways/g)).toHaveLength(1)
  })
})

describe('牌の絵柄', () => {
  const art = (tile: { kind: number; red: boolean }) =>
    renderToStaticMarkup(
      <svg>
        <TileArt tile={tile} />
      </svg>,
    )

  it('34種と赤5をすべて描け、文字は端末のフォント(text 要素)を使わない', () => {
    for (const tile of [...ALL_KINDS.map((kind) => ({ kind, red: false })), ...RED_FIVES]) {
      const html = art(tile)
      expect(html).not.toContain('<text')
      // 文字のある牌(萬子・東南西北發中)はフォントから作ったパスで描く
      const hasGlyph = tile.kind < 9 || (tile.kind >= 27 && tile.kind !== 31)
      if (hasGlyph) expect(html).toContain('<path')
    }
  })

  it('白は何も描かない(表面と厚みだけ)', () => {
    const html = art({ kind: 31, red: false })
    expect(html).not.toContain('<path')
    expect(html).not.toContain('<circle')
    expect(html.match(/<rect/g)).toHaveLength(3)
  })

  it('赤5だけに赤い印が付く', () => {
    for (const red of RED_FIVES) {
      const normal = art({ kind: red.kind, red: false })
      const redHtml = art(red)
      expect(redHtml).not.toBe(normal)
      expect(redHtml.match(/<path/g)!.length).toBe((normal.match(/<path/g) ?? []).length + 1)
    }
  })
})

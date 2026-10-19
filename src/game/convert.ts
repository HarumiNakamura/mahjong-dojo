// サイトの牌の表現(engine の Tile)と、@kobalab/majiang-core の牌の表記をつなぐ
//
// majiang-core の牌: 'm1'〜'm9'・'p'・'s'・'z1'〜'z7'。赤5は 'm0'。
// 手牌の文字列: 'm123p456z11'(色ごとにまとめる)。副露は ',' のあとに 'm1-23'(鳴いた牌の後ろに向きの印)。

import type { Meld } from '../engine/scoring'
import { kindOf, rankOf, suitOf, type Tile } from '../engine/tiles'

/** 牌1枚を majiang-core の表記にする */
export function toPai(t: Tile): string {
  return `${suitOf(t.kind)}${t.red ? 0 : rankOf(t.kind)}`
}

/** majiang-core の牌の表記を牌にする('m0' は赤5) */
export function fromPai(p: string): Tile {
  const s = p[0] as 'm' | 'p' | 's' | 'z'
  const n = Number(p[1])
  return n === 0 ? { kind: kindOf(s, 5), red: true } : { kind: kindOf(s, n), red: false }
}

/** 牌の並びを手牌の文字列にする(並び順のまま。色が変わるたびに色の文字を付ける) */
export function toPaistr(tiles: readonly Tile[]): string {
  let out = ''
  let suit = ''
  for (const t of tiles) {
    const p = toPai(t)
    if (p[0] !== suit) {
      suit = p[0]
      out += suit
    }
    out += p[1]
  }
  return out
}

/**
 * 副露を majiang-core の面子の表記にする(鳴いた牌は上家から:'-')
 * チー 'm1-23'(鳴いた牌の後ろに印)、ポン 'm555-'、大明槓 'm5555-'、加槓 'm555-5'、暗槓 'm5555'
 */
export function toMianzi(meld: Meld): string {
  const tiles = [...meld.tiles]
  const suit = suitOf(tiles[0].kind)
  const digits = tiles.map((t) => (t.red ? '0' : String(rankOf(t.kind))))
  switch (meld.type) {
    case 'chi':
      return `${suit}${digits[0]}-${digits.slice(1).join('')}`
    case 'pon':
    case 'minkan':
      return `${suit}${digits.join('')}-`
    case 'kakan':
      return `${suit}${digits.slice(0, 3).join('')}-${digits[3]}`
    case 'ankan':
      return suit + digits.join('')
  }
}

/** majiang-core の手牌の文字列から、牌の一覧(副露を除く)を取り出す */
export function tilesFromPaistr(paistr: string): Tile[] {
  const bingpai = paistr.split(',')[0]
  const tiles: Tile[] = []
  for (const group of bingpai.match(/[mpsz]\d+/g) ?? []) {
    for (const d of group.slice(1)) tiles.push(fromPai(group[0] + d))
  }
  return tiles
}

/** majiang-core の手牌から、画面に出す形(手の中の牌・ツモ牌・副露)を取り出す */
export function handView(paistr: string): { tiles: Tile[]; drawn: Tile | null; melds: { tiles: Tile[]; called: number | null }[] } {
  const [bingpai, ...fulou] = paistr.split(',')
  const all = tilesFromPaistr(bingpai.replace(/\*$/, ''))
  const melds = fulou.filter(Boolean).map(meldView)
  // 手の中の牌 + 副露 × 3 が 14 なら、最後の1枚がツモ牌
  const hasDrawn = all.length + melds.length * 3 === 14
  return { tiles: hasDrawn ? all.slice(0, -1) : all, drawn: hasDrawn ? all[all.length - 1] : null, melds }
}

/** 面子の表記('m1-23'・'z777='・'p5555' など)を牌の並びにする。called は鳴いた牌の位置 */
export function meldView(m: string): { tiles: Tile[]; called: number | null } {
  const suit = m[0]
  const tiles: Tile[] = []
  let called: number | null = null
  for (let i = 1; i < m.length; i++) {
    if (/\d/.test(m[i])) {
      if (/[+=-]/.test(m[i + 1] ?? '')) called = tiles.length
      tiles.push(fromPai(suit + m[i]))
    }
  }
  return { tiles, called }
}

/** 河の1枚('m3'・'m3*' リーチ宣言・'m3_' ツモ切り・'m3-' 鳴かれた牌) */
export function riverTile(p: string): { tile: Tile; lizhi: boolean; tsumogiri: boolean; called: boolean } {
  return { tile: fromPai(p.slice(0, 2)), lizhi: p.includes('*'), tsumogiri: p.includes('_'), called: /[+=-]/.test(p) }
}

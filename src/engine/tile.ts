// 牌の表記ルール(例: "123m456p789s1122z", 赤五は 0 で表す "0m")
// m=萬子, p=筒子, s=索子, z=字牌(1東 2南 3西 4北 5白 6發 7中)

export type Suit = 'm' | 'p' | 's' | 'z'

export interface Tile {
  suit: Suit
  /** 1〜9(字牌は1〜7) */
  rank: number
  /** 赤ドラなら true */
  red: boolean
}

const SUITS: readonly Suit[] = ['m', 'p', 's', 'z']

function isSuit(c: string): c is Suit {
  return (SUITS as readonly string[]).includes(c)
}

/** "123m0p" のような文字列を牌の配列に変換する。不正な表記ならエラーを投げる。 */
export function parseTiles(text: string): Tile[] {
  const tiles: Tile[] = []
  let digits: number[] = []
  for (const c of text) {
    if (c >= '0' && c <= '9') {
      digits.push(Number(c))
      continue
    }
    if (!isSuit(c)) throw new Error(`不正な文字です: ${c}`)
    if (digits.length === 0) throw new Error(`数字のない種類指定です: ${c}`)
    for (const d of digits) {
      if (c === 'z' && (d < 1 || d > 7)) throw new Error(`字牌は1〜7です: ${d}z`)
      tiles.push({ suit: c, rank: d === 0 ? 5 : d, red: d === 0 })
    }
    digits = []
  }
  if (digits.length > 0) throw new Error('末尾に種類(m/p/s/z)がありません')
  return tiles
}

// 鳴き判断(ポン・チー・スルー)
//
// 他家の捨て牌を鳴くかどうかを、次の4つで判断する。
//   1. 鳴いたあとに役が残るか(役牌のポン・断么九・混一色/清一色)。役がなければその鳴きは不正解
//   2. シャンテン数が進むか(進まない鳴きは不正解)
//   3. 打点がどれだけ下がるか(門前ならリーチ・断么九などで見込める翻数と、鳴いたあとの翻数を比べる)
//   4. 巡目(終盤ほど鳴いて早くしたほうがよい)
// 鳴いたあとの打牌も選ぶ。喰い替え(Mリーグルールで禁止)になる牌は切れない。
// 手牌は門前(副露なし)の13枚とする。

import { doraFromIndicator } from './scoring'
import { calcShantenFromTiles } from './shanten'
import { isHonor, rankOf, suitOf, tileName, tilesToCounts, type Tile } from './tiles'

export interface CallSituation {
  /** 自分の手牌(門前13枚) */
  hand: Tile[]
  /** 他家の捨て牌 */
  tile: Tile
  /** 切った人(1=下家、2=対面、3=上家)。チーは上家からだけ */
  from: 1 | 2 | 3
  turn: number
  doraIndicator: Tile
  seatWind: number
  roundWind: number
}

export type CallType = 'pon' | 'chi'

export type CallAnswer = { type: 'skip' } | { type: CallType; using: [number, number]; discard: number }

export interface DiscardEval {
  kind: number
  /** 切ったあとのシャンテン数 */
  shanten: number
  /** 鳴いたあとに確定している役 */
  yaku: string[]
  /** 鳴いたあとの翻数の目安(役 + ドラ) */
  han: number
}

export interface CallOption {
  type: CallType
  /** 手牌から出す2枚の種類 */
  using: [number, number]
  /** できる面子(牌の種類、小さい順) */
  meld: number[]
  /** 喰い替えになるので切れない牌の種類 */
  forbidden: number[]
  /** 切れる牌ごとの評価 */
  discards: DiscardEval[]
  /** 一番良い打牌(役があり、シャンテン数が一番小さく、翻数が高い) */
  best: DiscardEval
  /** 鳴く価値の点数(正なら鳴いたほうがよい) */
  score: number
  /** 判断の理由 */
  reasons: string[]
}

export interface CallAnalysis {
  /** 鳴かないときのシャンテン数 */
  shanten: number
  /** 門前で進めたときの翻数の目安(リーチ込み) */
  closedHan: number
  closedReasons: string[]
  options: CallOption[]
  /** 正解: 'call' = 鳴くのが正解、'skip' = スルーが正解、'either' = どちらも正解 */
  verdict: 'call' | 'skip' | 'either'
  /** 鳴くのが正解になる鳴き方(score が最大から CALL_MARGIN 以内で、正の値のもの) */
  goodOptions: CallOption[]
}

/** score がこの値より大きければ鳴き、−この値より小さければスルー、その間はどちらも正解 */
export const CALL_MARGIN = 10

const name = (k: number) => tileName({ kind: k, red: false })
const isSimple = (k: number) => !isHonor(k) && rankOf(k) >= 2 && rankOf(k) <= 8

export function yakuhaiKindsOf(s: Pick<CallSituation, 'seatWind' | 'roundWind'>): number[] {
  return [...new Set([31, 32, 33, 26 + s.seatWind, 26 + s.roundWind])]
}

/** 喰い替えで切れない牌(現物喰い替え・スジ喰い替え) */
export function kuikaeKinds(type: CallType, tile: number, using: readonly number[]): number[] {
  if (type === 'pon') return [tile]
  const lo = Math.min(tile, ...using)
  const hi = Math.max(tile, ...using)
  const out = [tile]
  const sameSuit = (k: number) => k >= 0 && k < 27 && suitOf(k) === suitOf(tile)
  // 両端の牌で鳴いたときは、反対側のスジも切れない(例: 23 で 4 をチー → 1 と 4 は切れない)
  if (tile === lo && sameSuit(tile + 3)) out.push(tile + 3)
  if (tile === hi && sameSuit(tile - 3)) out.push(tile - 3)
  return out
}

/** できる鳴き方の一覧 */
export function callCandidates(s: CallSituation): { type: CallType; using: [number, number] }[] {
  const counts = tilesToCounts(s.hand)
  const k = s.tile.kind
  const list: { type: CallType; using: [number, number] }[] = []
  if (counts[k] >= 2) list.push({ type: 'pon', using: [k, k] })
  if (s.from === 3 && !isHonor(k)) {
    const r = rankOf(k)
    const pairs: [number, number][] = []
    if (r >= 3) pairs.push([k - 2, k - 1])
    if (r >= 2 && r <= 8) pairs.push([k - 1, k + 1])
    if (r <= 7) pairs.push([k + 1, k + 2])
    for (const [a, b] of pairs) if (counts[a] > 0 && counts[b] > 0) list.push({ type: 'chi', using: [a, b] })
  }
  return list
}

/** 鳴いたあとの役と翻数 */
function openYaku(meld: number[], rest: readonly Tile[], s: CallSituation, isPon: boolean): { yaku: string[]; han: number } {
  const yaku: string[] = []
  let han = 0
  const yakuhai = yakuhaiKindsOf(s)
  const restCounts = tilesToCounts(rest)
  if (isPon && yakuhai.includes(meld[0])) {
    yaku.push(`役牌(${name(meld[0])})`)
    han += meld[0] === 26 + s.seatWind && meld[0] === 26 + s.roundWind ? 2 : 1
  }
  for (const k of yakuhai) {
    if (restCounts[k] >= 3) {
      yaku.push(`役牌(${name(k)})`)
      han += 1
    }
  }
  const all = [...meld, ...rest.map((t) => t.kind)]
  if (all.every(isSimple)) {
    yaku.push('断么九')
    han += 1
  }
  const suits = new Set(all.filter((k) => !isHonor(k)).map(suitOf))
  if (suits.size === 1) {
    const chin = all.every((k) => !isHonor(k))
    yaku.push(chin ? '清一色' : '混一色')
    han += chin ? 5 : 2
  }
  const doraKind = doraFromIndicator(s.doraIndicator.kind)
  const dora = all.filter((k) => k === doraKind).length + rest.filter((t) => t.red).length
  return { yaku, han: yaku.length > 0 ? han + dora : 0 }
}

function closedValue(s: CallSituation): { han: number; reasons: string[] } {
  const doraKind = doraFromIndicator(s.doraIndicator.kind)
  const dora = s.hand.filter((t) => t.kind === doraKind).length + s.hand.filter((t) => t.red).length
  const yaochu = s.hand.filter((t) => !isSimple(t.kind)).length
  const tanyao = yaochu <= 1 ? 1 : 0
  const counts = tilesToCounts(s.hand)
  const triples = yakuhaiKindsOf(s).filter((k) => counts[k] >= 3).length
  const han = 1 + tanyao + triples + dora
  const parts = ['リーチ', ...(tanyao ? ['断么九'] : []), ...(triples ? [`役牌${triples}`] : []), ...(dora ? [`ドラ${dora}`] : [])]
  return { han, reasons: [`門前で進めると ${parts.join('・')} で約${han}翻が見込めます。`] }
}

export function analyzeCall(s: CallSituation): CallAnalysis {
  const shanten = calcShantenFromTiles(s.hand).min
  const closed = closedValue(s)
  const options: CallOption[] = callCandidates(s).map(({ type, using }) => {
    const meld = [...using, s.tile.kind].sort((a, b) => a - b)
    const forbidden = kuikaeKinds(type, s.tile.kind, using)
    // 手牌から鳴きに使う2枚を除く(赤5でないほうを優先して残す必要はないので先頭から)
    const rest = [...s.hand]
    for (const u of using) rest.splice(rest.findIndex((t) => t.kind === u), 1)
    const kinds = [...new Set(rest.map((t) => t.kind))].filter((k) => !forbidden.includes(k))
    const discards: DiscardEval[] = kinds.map((k) => {
      const after = [...rest]
      after.splice(after.findIndex((t) => t.kind === k), 1)
      const { yaku, han } = openYaku(meld, after, s, type === 'pon')
      return { kind: k, shanten: calcShantenFromTiles(after).min, yaku, han }
    })
    const withYaku = discards.filter((d) => d.yaku.length > 0)
    const pool = withYaku.length > 0 ? withYaku : discards
    const best = [...pool].sort((a, b) => a.shanten - b.shanten || b.han - a.han || a.kind - b.kind)[0] ?? {
      kind: -1,
      shanten: 99,
      yaku: [],
      han: 0,
    }

    const reasons: string[] = []
    let score: number
    const label = type === 'pon' ? 'ポン' : `チー(${name(using[0])}${name(using[1])})`
    if (best.yaku.length === 0) {
      score = -100
      reasons.push(`${label}すると役がなくなります(門前ならリーチで役が作れます)。`)
    } else if (best.shanten >= shanten) {
      score = -60
      reasons.push(`${label}してもシャンテン数が進みません(${shanten} → ${best.shanten})。`)
    } else {
      const gain = shanten - best.shanten
      const late = s.turn >= 9 ? 15 : s.turn >= 6 ? 5 : 0
      const goodClosed = shanten <= 1 && s.turn <= 6 ? 20 : 0
      score = gain * 30 + (best.han - closed.han) * 15 + late + (best.shanten === 0 ? 15 : 0) - goodClosed
      reasons.push(`${label}するとシャンテン数が ${shanten} → ${best.shanten} に進み、${best.yaku.join('・')}で約${best.han}翻です。`)
      if (best.han < closed.han) reasons.push(`門前の約${closed.han}翻より打点が下がります。`)
      if (late > 0) reasons.push(`${s.turn}巡目なので、早くアガることの価値が高めです。`)
      if (goodClosed > 0) reasons.push('門前でもうすぐテンパイする形なので、まだ鳴かずにリーチを目指せます。')
    }
    return { type, using, meld, forbidden, discards, best, score, reasons }
  })

  const top = Math.max(-Infinity, ...options.map((o) => o.score))
  const verdict = top > CALL_MARGIN ? 'call' : top < -CALL_MARGIN || options.length === 0 ? 'skip' : 'either'
  const goodOptions = options.filter((o) => o.score > -CALL_MARGIN && o.score >= top - CALL_MARGIN)
  return { shanten, closedHan: closed.han, closedReasons: closed.reasons, options, verdict, goodOptions }
}

/** 回答が正解か */
export function judgeCall(a: CallAnalysis, answer: CallAnswer): boolean {
  if (answer.type === 'skip') return a.verdict !== 'call'
  if (a.verdict === 'skip') return false
  const opt = a.goodOptions.find(
    (o) => o.type === answer.type && o.using[0] === Math.min(...answer.using) && o.using[1] === Math.max(...answer.using),
  )
  if (!opt) return false
  const d = opt.discards.find((x) => x.kind === answer.discard)
  // 打牌: 役が残り、シャンテン数が一番良い打牌と同じ
  return d !== undefined && d.yaku.length > 0 && d.shanten === opt.best.shanten
}

export function callLabel(type: CallType, using: readonly number[]): string {
  return type === 'pon' ? 'ポン' : `チー(${name(using[0])}${name(using[1])})`
}

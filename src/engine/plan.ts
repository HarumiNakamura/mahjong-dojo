// 配牌方針の採点
//
// 配牌13枚+第1ツモの14枚を見て、6つの方針それぞれに点数(0〜100)と根拠をつける。
// 使う特徴: シャンテン数(通常手・七対子)、役牌の対子・刻子、ドラ・赤ドラの枚数、色の偏り、么九牌(1・9・字牌)の枚数、対子の数。
// 一番点数の高い方針から PLAN_MARGIN 点以内のものは、すべて正解にする。

import { doraFromIndicator } from './scoring'
import { calcShanten } from './shanten'
import { isHonor, kindOf, rankOf, tileName, tilesToCounts, type Suit, type Tile } from './tiles'

export type PlanId = 'riichi' | 'tanyao' | 'yakuhai' | 'someTe' | 'chiitoi' | 'defense'

export const PLANS: readonly { id: PlanId; label: string; tip: string }[] = [
  { id: 'riichi', label: '門前リーチ', tip: '鳴かずに手を進め、テンパイしたらリーチします。両面になりやすい形を残しましょう。' },
  { id: 'tanyao', label: 'タンヤオ(鳴きOK)', tip: '1・9・字牌から先に切り、2〜8だけで手を作ります。鳴いても役がつきます。' },
  { id: 'yakuhai', label: '役牌', tip: '役牌を重ねたら鳴いて早くアガります。役牌の対子は大切に。' },
  { id: 'someTe', label: '混一色・清一色', tip: '多い色と字牌だけを残し、ほかの色から切ります。打点が高くなります。' },
  { id: 'chiitoi', label: '七対子', tip: '対子を7組そろえます。字牌や端の牌の単騎待ちが狙い目です。' },
  { id: 'defense', label: '早めに守備寄り', tip: 'アガリが遠いので、安全な牌を残しながら進め、リーチが来たら降ります。' },
]

/** これ以内の差の方針も正解にする */
export const PLAN_MARGIN = 10

export interface PlanFeatures {
  /** 通常手のシャンテン数(14枚から1枚切ったときの一番良い値) */
  shanten: number
  chiitoiShanten: number
  /** 役牌の種類ごとの枚数(2枚以上のもの) */
  yakuhaiPairs: { kind: number; count: number }[]
  dora: number
  red: number
  /** 一番多い色とその枚数 */
  mainSuit: Suit
  mainSuitCount: number
  honors: number
  /** 么九牌(1・9・字牌)の枚数 */
  yaochu: number
  pairs: number
}

export interface PlanScore {
  id: PlanId
  label: string
  score: number
  reasons: string[]
}

export interface PlanContext {
  doraIndicator: Tile
  /** 自風(1=東) */
  seatWind: number
  /** 場風(1=東) */
  roundWind: number
}

const SUIT_NAMES: Record<Suit, string> = { m: '萬子', p: '筒子', s: '索子', z: '字牌' }
const name = (k: number) => tileName({ kind: k, red: false })

/** 役牌になる字牌の種類(三元牌・自風・場風) */
export function yakuhaiKinds(ctx: Pick<PlanContext, 'seatWind' | 'roundWind'>): number[] {
  return [...new Set([31, 32, 33, 26 + ctx.seatWind, 26 + ctx.roundWind])]
}

/** 14枚から1枚切ったときの一番小さいシャンテン数 */
function bestShanten(counts: number[], pick: (c: number[]) => number): number {
  let best = Infinity
  for (let k = 0; k < 34; k++) {
    if (counts[k] === 0) continue
    counts[k]--
    best = Math.min(best, pick(counts))
    counts[k]++
  }
  return best
}

export function planFeatures(tiles: readonly Tile[], ctx: PlanContext): PlanFeatures {
  const counts = tilesToCounts(tiles)
  const shanten = bestShanten(counts, (c) => calcShanten(c).normal)
  const chiitoiShanten = bestShanten(counts, (c) => calcShanten(c).chiitoitsu)
  const yakuhaiPairs = yakuhaiKinds(ctx)
    .filter((k) => counts[k] >= 2)
    .map((k) => ({ kind: k, count: counts[k] }))
  const doraKind = doraFromIndicator(ctx.doraIndicator.kind)
  const suits: Suit[] = ['m', 'p', 's']
  const suitCount = (s: Suit) => tiles.filter((t) => !isHonor(t.kind) && t.kind >= kindOf(s, 1) && t.kind <= kindOf(s, 9)).length
  const mainSuit = suits.reduce((a, b) => (suitCount(b) > suitCount(a) ? b : a))
  return {
    shanten,
    chiitoiShanten,
    yakuhaiPairs,
    dora: counts[doraKind],
    red: tiles.filter((t) => t.red).length,
    mainSuit,
    mainSuitCount: suitCount(mainSuit),
    honors: tiles.filter((t) => isHonor(t.kind)).length,
    yaochu: tiles.filter((t) => isHonor(t.kind) || rankOf(t.kind) === 1 || rankOf(t.kind) === 9).length,
    pairs: counts.filter((n) => n >= 2).length,
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function scorePlans(tiles: readonly Tile[], ctx: PlanContext): PlanScore[] {
  const f = planFeatures(tiles, ctx)
  const value = f.dora + f.red
  const valueText = value > 0 ? `ドラ・赤ドラが${value}枚あり打点が見込めます。` : ''
  const shantenText = `シャンテン数は${f.shanten}です。`
  const scores: Record<PlanId, { score: number; reasons: string[] }> = {
    riichi: { score: 0, reasons: [] },
    tanyao: { score: 0, reasons: [] },
    yakuhai: { score: 0, reasons: [] },
    someTe: { score: 0, reasons: [] },
    chiitoi: { score: 0, reasons: [] },
    defense: { score: 0, reasons: [] },
  }

  // 門前リーチ: 手が早いほど良い。役牌の対子があると鳴いたほうが早いので少し下げる
  {
    const base = { 0: 85, 1: 80, 2: 70, 3: 55, 4: 40 }[f.shanten] ?? 25
    const s = base + value * 4 - f.yakuhaiPairs.length * 5
    const r = [`${shantenText}${f.shanten <= 2 ? '門前でも十分間に合います。' : 'リーチまでは少し遠い形です。'}`]
    if (value > 0) r.push(valueText)
    scores.riichi = { score: s, reasons: r }
  }

  // タンヤオ: 么九牌が少ないほど良い
  {
    const s = 80 - f.yaochu * 12 + (f.shanten <= 2 ? 5 : 0) + value * 3
    const r =
      f.yaochu <= 2
        ? [`么九牌(1・9・字牌)が${f.yaochu}枚と少なく、鳴いても断么九で役がつきます。`]
        : [`么九牌(1・9・字牌)が${f.yaochu}枚あり、断么九にするには${f.yaochu}枚切る必要があります。`]
    scores.tanyao = { score: s, reasons: r }
  }

  // 役牌: 役牌の対子・刻子があれば鳴いてすぐ役がつく
  {
    if (f.yakuhaiPairs.length > 0) {
      const trip = f.yakuhaiPairs.some((p) => p.count >= 3)
      const s = 75 + (f.yakuhaiPairs.length - 1) * 10 + (trip ? 10 : 0) + value * 3 + (f.shanten <= 2 ? 5 : 0)
      const what = f.yakuhaiPairs.map((p) => `${name(p.kind)}が${p.count >= 3 ? '刻子' : '対子'}`).join('、')
      scores.yakuhai = { score: s, reasons: [`${what}なので、鳴いてもすぐ役がつきます。`] }
    } else {
      scores.yakuhai = { score: 10, reasons: ['役牌の対子がないので、役牌で役を作るのは難しい形です。'] }
    }
  }

  // 混一色・清一色: 一番多い色と字牌の合計
  {
    const c = f.mainSuitCount + f.honors
    const s = (c - 7) * 12 + (f.mainSuitCount >= 11 ? 10 : 0)
    const r =
      c >= 9
        ? [
            `${SUIT_NAMES[f.mainSuit]}が${f.mainSuitCount}枚${f.honors > 0 ? `・字牌が${f.honors}枚` : ''}あり、${f.mainSuitCount >= 11 ? '清一色' : '混一色'}の候補です。`,
          ]
        : [`一番多い${SUIT_NAMES[f.mainSuit]}でも${f.mainSuitCount}枚${f.honors > 0 ? `(字牌${f.honors}枚)` : ''}で、色を集めるには遠い形です。`]
    scores.someTe = { score: s, reasons: r }
  }

  // 七対子: 対子の数
  {
    const s = { 7: 95, 6: 92, 5: 80, 4: 55, 3: 25 }[Math.min(7, f.pairs)] ?? 5
    const adj = f.shanten <= 1 ? -20 : 0
    const r = [`対子が${f.pairs}組あります(七対子のシャンテン数は${f.chiitoiShanten})。`]
    if (adj < 0) r.push('ただし通常の形でも早いので、無理に七対子にしなくてもよい形です。')
    scores.chiitoi = { score: s + adj, reasons: r }
  }

  // 守備寄り: 手が遠く、打点も役もないとき
  {
    const far = f.shanten >= 5 ? 65 : f.shanten === 4 ? 45 : f.shanten === 3 ? 15 : 0
    const s = far - value * 8 - f.yakuhaiPairs.length * 15 - (f.pairs >= 5 ? 20 : 0)
    const r =
      f.shanten >= 3
        ? [`シャンテン数が${f.shanten}と遠く${value === 0 ? '、ドラもない' : ''}ので、安全な牌を残しながら進める考え方もあります。`]
        : ['手が早いので、守備寄りにする必要はあまりありません。']
    scores.defense = { score: s, reasons: r }
  }

  return PLANS.map((p) => ({ id: p.id, label: p.label, score: clamp(scores[p.id].score), reasons: scores[p.id].reasons }))
}

/** 正解の方針(一番点数の高い方針から PLAN_MARGIN 点以内) */
export function correctPlans(scores: readonly PlanScore[]): PlanId[] {
  const top = Math.max(...scores.map((s) => s.score))
  return scores.filter((s) => s.score >= top - PLAN_MARGIN).map((s) => s.id)
}

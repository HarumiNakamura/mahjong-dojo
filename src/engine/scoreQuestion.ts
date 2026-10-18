// 点数計算ドリルの問題作り
//
// 実戦に近い比率になるよう、面子と雀頭を組み立ててアガリ形を作る:
//   - 面子は順子が多め(約8割)。約半分の手は中張牌(2〜8)だけで作る(断么九が出やすい)
//   - 門前が約7割。門前ならリーチが約5割。ツモは約4割
//   - アガリ牌は両面待ちになる位置を優先する(平和が出やすい)
//   - ドラ表示牌は1枚。5の牌はときどき赤5にする
// 鳴いた手は役(断么九・役牌など)がないと捨てる。役満の手は出さない。

import { randomInt, shuffle, type Rng } from './random'
import { calculateScore, type Meld, type MeldType, type ScoreResult, type WinContext } from './scoring'
import { formatTiles, kindOf, parseTiles, sortTiles, type Suit, type Tile } from './tiles'

export type ScoreLevel = 'beginner' | 'intermediate' | 'advanced'

export const SCORE_LEVELS: readonly { id: ScoreLevel; label: string; description: string }[] = [
  { id: 'beginner', label: '初級', description: '成立している役をすべて選びます(ドラは役ではありません)。' },
  { id: 'intermediate', label: '中級', description: '翻数(ドラを含む)と符を答えます。' },
  { id: 'advanced', label: '上級', description: '点数を答えます。親か子か、ツモかロンかで払い方が変わります。' },
]

/** 初級の選択肢に混ぜる、よく出る役 */
export const COMMON_YAKU = [
  '立直',
  '一発',
  '門前清自摸和',
  '断么九',
  '平和',
  '一盃口',
  '役牌 白',
  '役牌 發',
  '役牌 中',
  '自風牌',
  '場風牌',
  '三色同順',
  '一気通貫',
  '混全帯么九',
  '対々和',
  '三暗刻',
  '七対子',
  '混一色',
]

/** 問題を保存・再現するための形 */
export interface ScoreQuestionData {
  level: ScoreLevel
  /** 副露を除いた手牌(アガリ牌を含む) */
  hand: string
  win: string
  melds: [MeldType, string][]
  tsumo: boolean
  roundWind: number
  seatWind: number
  riichi: boolean
  ippatsu: boolean
  dora: string
  ura: string
  /** 初級の選択肢 */
  choices: string[]
}

export interface ScoreQuestion {
  data: ScoreQuestionData
  hand: Tile[]
  winTile: Tile
  melds: Meld[]
  context: WinContext
  result: ScoreResult
}

export type ScoreAnswer = { yaku: string[] } | { han: number; fu: number } | { points: number[] }

// ---- アガリ形を組み立てる ----

const SUITS: Suit[] = ['m', 'p', 's']
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[randomInt(rng, items.length)]

interface Built {
  counts: number[]
  /** 面子(牌の種類3つ)と雀頭 */
  mentsu: number[][]
  pair: number
}

function buildBlocks(rng: Rng, simplesOnly: boolean): Built | null {
  const counts = new Array<number>(34).fill(0)
  const mentsu: number[][] = []
  for (let i = 0; i < 4; i++) {
    const suit = pick(rng, SUITS)
    if (rng() < 0.8) {
      const startOf = () => kindOf(suit, simplesOnly ? 2 + randomInt(rng, 5) : 1 + randomInt(rng, 7))
      let k = startOf()
      // 同じ順子が重なると一盃口ばかりになるので、多くの場合は選び直す
      if (mentsu.some((m) => m[0] === k && m[1] === k + 1) && rng() < 0.75) k = startOf()
      mentsu.push([k, k + 1, k + 2])
    } else if (!simplesOnly && rng() < 0.35) {
      // 字牌の刻子(三元牌と風牌)
      const k = 27 + randomInt(rng, 7)
      mentsu.push([k, k, k])
    } else {
      const k = kindOf(suit, simplesOnly ? 2 + randomInt(rng, 7) : 1 + randomInt(rng, 9))
      mentsu.push([k, k, k])
    }
  }
  const pair = simplesOnly || rng() < 0.8 ? kindOf(pick(rng, SUITS), simplesOnly ? 2 + randomInt(rng, 7) : 1 + randomInt(rng, 9)) : 27 + randomInt(rng, 7)
  for (const m of mentsu) for (const k of m) counts[k]++
  counts[pair] += 2
  if (counts.some((n) => n > 4)) return null
  return { counts, mentsu, pair }
}

/** アガリ牌を選ぶ(両面待ちになる位置を優先) */
function chooseWin(rng: Rng, b: Built, concealed: number[]): number {
  const shuntsu = concealed.filter((i) => b.mentsu[i][0] !== b.mentsu[i][1])
  if (shuntsu.length > 0 && rng() < 0.7) {
    const m = b.mentsu[pick(rng, shuntsu)]
    const rank = (m[0] % 9) + 1
    // 両面になるのは 123 の 3 以外の端・789 の 7 以外の端
    const ends = [m[0], m[2]].filter((k) => !(k === m[0] && rank === 7) && !(k === m[2] && rank === 1))
    if (ends.length > 0) return pick(rng, ends)
  }
  const options = rng() < 0.2 ? [b.pair] : concealed.flatMap((i) => b.mentsu[i])
  return pick(rng, options.length > 0 ? options : [b.pair])
}

function toTiles(kinds: number[], redOk: Set<number>): Tile[] {
  return kinds.map((kind) => {
    if (redOk.has(kind)) {
      redOk.delete(kind)
      return { kind, red: true }
    }
    return { kind, red: false }
  })
}

/** 実戦に近い状況つきのアガリ形を1つ作る(作れなければ null) */
function buildQuestion(level: ScoreLevel, rng: Rng): ScoreQuestion | null {
  const simplesOnly = rng() < 0.5
  const b = buildBlocks(rng, simplesOnly)
  if (!b) return null

  // 鳴き(約3割)。1〜2つの面子を副露にする
  const open = rng() < 0.3
  const meldIdx = open ? shuffle([0, 1, 2, 3], rng).slice(0, 1 + randomInt(rng, 2)) : []
  const concealedIdx = [0, 1, 2, 3].filter((i) => !meldIdx.includes(i))
  const win = chooseWin(rng, b, concealedIdx)

  // 赤5: 5の牌のうち、色ごとに約15%で1枚を赤にする
  const reds = new Set<number>()
  for (const suit of SUITS) {
    const five = kindOf(suit, 5)
    if (b.counts[five] > 0 && rng() < 0.15) reds.add(five)
  }

  const meldKinds = meldIdx.map((i) => b.mentsu[i])
  const handKinds = [...concealedIdx.flatMap((i) => b.mentsu[i]), b.pair, b.pair].sort((x, y) => x - y)
  const melds: Meld[] = meldKinds.map((m) => ({ type: m[0] === m[1] ? 'pon' : 'chi', tiles: toTiles(m, reds) }))
  const hand = sortTiles(toTiles(handKinds, reds))
  const winTile = hand.find((t) => t.kind === win && !t.red) ?? hand.find((t) => t.kind === win)!

  // ドラ表示牌は、手牌と合わせて4枚を超えない牌から選ぶ
  const used = [...b.counts]
  const indicator = (): Tile => {
    for (;;) {
      const k = randomInt(rng, 34)
      if (used[k] < 4) {
        used[k]++
        return { kind: k, red: false }
      }
    }
  }
  const riichi = !open && rng() < 0.5
  const tsumo = rng() < 0.4
  const dora = indicator()
  const ura = riichi ? indicator() : null
  const context: WinContext = {
    tsumo,
    roundWind: rng() < 0.75 ? 1 : 2,
    seatWind: 1 + randomInt(rng, 4),
    riichi,
    ippatsu: riichi && rng() < 0.08,
    doraIndicators: [dora],
    uraDoraIndicators: ura ? [ura] : [],
  }
  const result = calculateScore({ hand, winTile, melds, context })
  if (!result.ok || result.yakuman.length > 0) return null
  if (level === 'intermediate' && result.han > 4) return null
  if (level !== 'advanced' && result.han > 8) return null

  const yakuNames = result.yaku.map((y) => y.name)
  const distractors = shuffle(
    COMMON_YAKU.filter((y) => !yakuNames.includes(y)),
    rng,
  ).slice(0, Math.max(3, 8 - yakuNames.length))
  const data: ScoreQuestionData = {
    level,
    hand: formatTiles(hand),
    win: formatTiles([winTile]),
    melds: melds.map((m) => [m.type, formatTiles(m.tiles)]),
    tsumo,
    roundWind: context.roundWind,
    seatWind: context.seatWind,
    riichi,
    ippatsu: context.ippatsu === true,
    dora: formatTiles([dora]),
    ura: ura ? formatTiles([ura]) : '',
    choices: shuffle([...yakuNames, ...distractors], rng),
  }
  return { data, hand, winTile, melds, context, result }
}

/** 段階に合った点数計算の問題を作る */
export function generateScoreQuestion(level: ScoreLevel, rng: Rng, maxAttempts = 5000): ScoreQuestion {
  for (let i = 0; i < maxAttempts; i++) {
    const q = buildQuestion(level, rng)
    if (q) return q
  }
  throw new Error('点数計算の問題を作れませんでした')
}

// ---- 判定 ----

/** 上級で答える点数の数(ロン・親のツモは1つ、子のツモは「子の支払い・親の支払い」の2つ) */
export function expectedPoints(q: ScoreQuestion): number[] {
  const p = q.result.payment
  if (p.type === 'ron') return [p.fromDiscarder]
  return p.fromDealer === null ? [p.fromNonDealer] : [p.fromNonDealer, p.fromDealer]
}

export function judgeScore(q: ScoreQuestion, answer: ScoreAnswer): boolean {
  if ('yaku' in answer) {
    const correct = [...q.result.yaku.map((y) => y.name)].sort()
    const chosen = [...new Set(answer.yaku)].sort()
    return chosen.length === correct.length && chosen.every((y, i) => y === correct[i])
  }
  if ('han' in answer) return answer.han === q.result.han && answer.fu === q.result.fu
  const expected = expectedPoints(q)
  return answer.points.length === expected.length && answer.points.every((n, i) => n === expected[i])
}

// ---- 保存と復元 ----

export function fromScoreData(value: unknown): ScoreQuestion {
  const d = value as Partial<ScoreQuestionData> | null
  if (
    !d ||
    !SCORE_LEVELS.some((l) => l.id === d.level) ||
    typeof d.hand !== 'string' ||
    typeof d.win !== 'string' ||
    !Array.isArray(d.melds) ||
    typeof d.tsumo !== 'boolean' ||
    typeof d.roundWind !== 'number' ||
    typeof d.seatWind !== 'number' ||
    typeof d.dora !== 'string' ||
    typeof d.ura !== 'string' ||
    !Array.isArray(d.choices)
  ) {
    throw new Error('点数計算の問題データが正しくありません')
  }
  const hand = parseTiles(d.hand)
  const winTile = parseTiles(d.win)[0]
  const melds: Meld[] = d.melds.map(([type, tiles]) => ({ type, tiles: parseTiles(tiles) }))
  const context: WinContext = {
    tsumo: d.tsumo,
    roundWind: d.roundWind,
    seatWind: d.seatWind,
    riichi: d.riichi === true,
    ippatsu: d.ippatsu === true,
    doraIndicators: parseTiles(d.dora),
    uraDoraIndicators: d.ura ? parseTiles(d.ura) : [],
  }
  const result = calculateScore({ hand, winTile, melds, context })
  if (!result.ok) throw new Error('点数計算の問題データが正しくありません')
  return { data: d as ScoreQuestionData, hand, winTile, melds, context, result }
}

export function scoreKeyOf(q: ScoreQuestion): string {
  const d = q.data
  return [d.hand, d.win, d.melds.map((m) => m.join(':')).join(','), d.tsumo ? 'T' : 'R', d.roundWind, d.seatWind, d.riichi ? 'R' : '', d.ippatsu ? 'I' : '', d.dora, d.ura].join('|')
}

/** 風の名前 */
export const WIND_NAMES = ['', '東', '南', '西', '北']

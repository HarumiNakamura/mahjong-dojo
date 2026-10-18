// 役・符・点数の計算(docs/rules.md 11〜13章。Mリーグ公式ルール準拠)
//
// 手牌の分け方が複数あるとき(アガリ牌がどの塊に入るかの見方も含む)は、すべて計算して一番高い点数を選ぶ。
// パオ(責任払い)はこの計算には含めない。

import { RULES } from './rules'
import { isHonor, rankOf, suitOf, TILE_KINDS, tilesToCounts, type Tile } from './tiles'

// ---- 入力 ----

export type MeldType = 'chi' | 'pon' | 'minkan' | 'ankan' | 'kakan'

/** 副露(チー・ポン・明槓・暗槓・加槓) */
export interface Meld {
  type: MeldType
  tiles: Tile[]
}

export interface WinContext {
  /** ツモアガリなら true、ロンなら false */
  tsumo: boolean
  /** 場風(1=東, 2=南, 3=西, 4=北) */
  roundWind: number
  /** 自風(1=東=親, 2=南, 3=西, 4=北) */
  seatWind: number
  riichi?: boolean
  doubleRiichi?: boolean
  ippatsu?: boolean
  /** 海底摸月(最後の牌をツモ) */
  haitei?: boolean
  /** 河底撈魚(最後の捨て牌でロン) */
  houtei?: boolean
  /** 嶺上開花(カンのあとの嶺上牌でツモ) */
  rinshan?: boolean
  /** 搶槓(加槓した牌でロン) */
  chankan?: boolean
  /** 天和(親の配牌でアガリ) */
  tenhou?: boolean
  /** 地和(子の第一ツモでアガリ) */
  chiihou?: boolean
  /** ドラ表示牌(表ドラとカンドラ) */
  doraIndicators?: Tile[]
  /** 裏ドラ表示牌(裏ドラとカン裏。リーチしたときだけ数える) */
  uraDoraIndicators?: Tile[]
  /** 本場の数 */
  honba?: number
  /** 供託のリーチ棒の本数 */
  riichiSticks?: number
}

export interface ScoreInput {
  /** 副露を除いた手牌(アガリ牌を含む) */
  hand: Tile[]
  melds?: Meld[]
  /** アガリ牌 */
  winTile: Tile
  context: WinContext
}

// ---- 出力 ----

export interface YakuItem {
  name: string
  han: number
}

export interface YakumanItem {
  name: string
  /** 何倍役満か(このルールではすべて1) */
  multiplier: number
}

export interface FuItem {
  label: string
  fu: number
}

export type WaitType = 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon' | 'tanki'

export type LimitName = 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman'

export const LIMIT_LABELS: Record<LimitName, string> = {
  mangan: '満貫',
  haneman: '跳満',
  baiman: '倍満',
  sanbaiman: '三倍満',
  yakuman: '役満',
}

export interface ScoreBlock {
  type: 'shuntsu' | 'koutsu' | 'kantsu' | 'pair'
  kinds: number[]
  /** 副露、またはロンで完成した刻子(明刻扱い) */
  open: boolean
}

export interface ScoreResult {
  ok: true
  /** 手の形 */
  shape: 'normal' | 'chiitoitsu' | 'kokushi'
  /** 手牌の分け方(通常形のとき) */
  blocks: ScoreBlock[]
  /** 待ちの形(通常形のとき) */
  wait: WaitType | null
  /** 成立した役(ドラを除く) */
  yaku: YakuItem[]
  /** ドラ・裏ドラ・赤ドラ(0枚のものは含めない) */
  dora: YakuItem[]
  /** 役満(なければ空) */
  yakuman: YakumanItem[]
  /** 翻数の合計(ドラを含む。役満のときは 0) */
  han: number
  /** 符(切り上げ後) */
  fu: number
  /** 切り上げ前の符 */
  fuRaw: number
  fuItems: FuItem[]
  limit: LimitName | null
  /** 「30符4翻 満貫」「2倍役満」などの表示 */
  label: string
  /** 基本点 */
  basePoints: number
  dealer: boolean
  /** 支払い(本場を含まない) */
  payment: { type: 'ron'; fromDiscarder: number } | { type: 'tsumo'; fromDealer: number | null; fromNonDealer: number }
  /** アガリの点数(本場・供託を含まない) */
  points: number
  /** 本場の点数 */
  honbaPoints: number
  /** 供託の点数 */
  riichiStickPoints: number
  /** 受け取る合計 */
  total: number
}

export interface ScoreFailure {
  ok: false
  reason: string
}

// ---- 牌の性質 ----

const isTerminal = (k: number) => !isHonor(k) && (rankOf(k) === 1 || rankOf(k) === 9)
const isYaochu = (k: number) => isHonor(k) || isTerminal(k)
const isDragon = (k: number) => k >= 31
const isWind = (k: number) => k >= 27 && k <= 30
const windKind = (wind: number) => 26 + wind
const GREEN = new Set([19, 20, 21, 23, 25, 32]) // 2s 3s 4s 6s 8s 發

/** ドラ表示牌の次の牌(9→1、北→東、中→白) */
export function doraFromIndicator(indicator: number): number {
  if (indicator < 27) return indicator - (indicator % 9) + ((indicator % 9) + 1) % 9
  if (indicator <= 30) return 27 + ((indicator - 27 + 1) % 4)
  return 31 + ((indicator - 31 + 1) % 3)
}

/** 副露を文字列表記から作る(テスト・問題作り用)。例: meld('pon', parseTiles('555z')) */
export function meld(type: MeldType, tiles: Tile[]): Meld {
  return { type, tiles }
}

// ---- 手牌の分け方 ----

interface Block {
  type: 'shuntsu' | 'koutsu' | 'kantsu' | 'pair'
  kinds: number[]
  open: boolean
  fromMeld: boolean
  meldType?: MeldType
}

function splitMentsu(counts: number[], start = 0): Block[][] {
  let i = start
  while (i < TILE_KINDS && counts[i] === 0) i++
  if (i >= TILE_KINDS) return [[]]
  const result: Block[][] = []
  if (counts[i] >= 3) {
    counts[i] -= 3
    for (const rest of splitMentsu(counts, i)) result.push([{ type: 'koutsu', kinds: [i, i, i], open: false, fromMeld: false }, ...rest])
    counts[i] += 3
  }
  if (!isHonor(i) && rankOf(i) <= 7 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--
    counts[i + 1]--
    counts[i + 2]--
    for (const rest of splitMentsu(counts, i)) {
      result.push([{ type: 'shuntsu', kinds: [i, i + 1, i + 2], open: false, fromMeld: false }, ...rest])
    }
    counts[i]++
    counts[i + 1]++
    counts[i + 2]++
  }
  return result
}

function meldBlock(m: Meld): Block {
  const kinds = m.tiles.map((t) => t.kind).sort((a, b) => a - b)
  if (m.type === 'chi') return { type: 'shuntsu', kinds, open: true, fromMeld: true, meldType: m.type }
  if (m.type === 'pon') return { type: 'koutsu', kinds, open: true, fromMeld: true, meldType: m.type }
  return { type: 'kantsu', kinds, open: m.type !== 'ankan', fromMeld: true, meldType: m.type }
}

function waitOf(block: Block, win: number): WaitType {
  if (block.type === 'pair') return 'tanki'
  if (block.type === 'koutsu') return 'shanpon'
  const a = block.kinds[0]
  if (win === a + 1) return 'kanchan'
  if ((win === a + 2 && rankOf(a) === 1) || (win === a && rankOf(a) === 7)) return 'penchan'
  return 'ryanmen'
}

// ---- 評価 ----

interface Candidate {
  shape: ScoreResult['shape']
  blocks: Block[]
  wait: WaitType | null
  yaku: YakuItem[]
  yakuman: YakumanItem[]
  fuItems: FuItem[]
  fuRaw: number
  fu: number
}

interface Env {
  input: ScoreInput
  ctx: WinContext
  /** 手牌と副露のすべての牌 */
  allTiles: Tile[]
  allKinds: number[]
  counts: number[]
  menzen: boolean
  melds: Meld[]
  dealer: boolean
}

const round10 = (n: number) => Math.ceil(n / 10) * 10
const ceil100 = (n: number) => Math.ceil(n / 100) * 100

/** 状況役(手の形によらない役) */
function situationalYaku(env: Env): YakuItem[] {
  const { ctx, menzen } = env
  const y: YakuItem[] = []
  if (ctx.doubleRiichi) y.push({ name: 'ダブル立直', han: 2 })
  else if (ctx.riichi) y.push({ name: '立直', han: 1 })
  if (ctx.ippatsu) y.push({ name: '一発', han: 1 })
  if (menzen && ctx.tsumo) y.push({ name: '門前清自摸和', han: 1 })
  if (ctx.rinshan) y.push({ name: '嶺上開花', han: 1 })
  if (ctx.chankan) y.push({ name: '搶槓', han: 1 })
  if (ctx.haitei) y.push({ name: '海底摸月', han: 1 })
  if (ctx.houtei) y.push({ name: '河底撈魚', han: 1 })
  return y
}

/** 牌の種類だけで決まる役(染め手・断么九・混老頭) */
function colorYaku(env: Env, hasShuntsu: boolean): YakuItem[] {
  const kinds = env.allKinds
  const y: YakuItem[] = []
  if (kinds.every((k) => !isYaochu(k))) y.push({ name: '断么九', han: 1 })
  const suits = new Set(kinds.filter((k) => !isHonor(k)).map(suitOf))
  const hasHonor = kinds.some(isHonor)
  if (suits.size === 1 && !hasHonor) y.push({ name: '清一色', han: env.menzen ? 6 : 5 })
  else if (suits.size === 1 && hasHonor) y.push({ name: '混一色', han: env.menzen ? 3 : 2 })
  if (!hasShuntsu && kinds.every(isYaochu) && hasHonor && kinds.some(isTerminal)) y.push({ name: '混老頭', han: 2 })
  return y
}

/** 役満の判定(手の形ごと) */
function yakumanOf(env: Env, shape: Candidate['shape'], blocks: Block[]): YakumanItem[] {
  const { ctx, allKinds, counts } = env
  const y: YakumanItem[] = []
  const add = (name: string) => y.push({ name, multiplier: 1 })
  if (ctx.tenhou) add('天和')
  if (ctx.chiihou) add('地和')
  if (shape === 'kokushi') add('国士無双')
  if (allKinds.every(isHonor)) add('字一色')
  if (allKinds.every((k) => GREEN.has(k))) add('緑一色')
  if (allKinds.every(isTerminal)) add('清老頭')
  if (shape === 'normal') {
    const sets = blocks.filter((b) => b.type !== 'pair')
    const pair = blocks.find((b) => b.type === 'pair')!
    const triplets = sets.filter((b) => b.type !== 'shuntsu')
    const concealedTriplets = triplets.filter((b) => !b.open)
    if (concealedTriplets.length === 4) add('四暗刻')
    if (triplets.filter((b) => isDragon(b.kinds[0])).length === 3) add('大三元')
    const windTriplets = triplets.filter((b) => isWind(b.kinds[0])).length
    if (windTriplets === 4) add('大四喜')
    else if (windTriplets === 3 && isWind(pair.kinds[0])) add('小四喜')
    if (sets.filter((b) => b.type === 'kantsu').length === 4) add('四槓子')
    // 九蓮宝燈: 門前・1色で、1112345678999 + 同じ色の1枚
    if (env.melds.length === 0) {
      const suits = new Set(allKinds.map(suitOf))
      if (suits.size === 1 && !isHonor(allKinds[0])) {
        const base = allKinds[0] - (allKinds[0] % 9)
        const need = [3, 1, 1, 1, 1, 1, 1, 1, 3]
        if (need.every((n, i) => counts[base + i] >= n)) add('九蓮宝燈')
      }
    }
  }
  return y
}

/** 通常形の役(役満でないもの) */
function normalYaku(env: Env, blocks: Block[], pinfu: boolean): YakuItem[] {
  const { ctx, menzen } = env
  const y: YakuItem[] = [...situationalYaku(env)]
  const sets = blocks.filter((b) => b.type !== 'pair')
  const pair = blocks.find((b) => b.type === 'pair')!
  const shuntsu = sets.filter((b) => b.type === 'shuntsu')
  const triplets = sets.filter((b) => b.type !== 'shuntsu')

  if (pinfu) y.push({ name: '平和', han: 1 })

  // 一盃口・二盃口(門前のみ)
  if (menzen) {
    const keys = shuntsu.map((b) => b.kinds[0]).sort((a, b) => a - b)
    let pairs = 0
    for (let i = 0; i + 1 < keys.length; i++) {
      if (keys[i] === keys[i + 1]) {
        pairs++
        i++
      }
    }
    if (pairs === 2) y.push({ name: '二盃口', han: 3 })
    else if (pairs === 1) y.push({ name: '一盃口', han: 1 })
  }

  // 役牌
  for (const b of triplets) {
    const k = b.kinds[0]
    if (k === 31) y.push({ name: '役牌 白', han: 1 })
    if (k === 32) y.push({ name: '役牌 發', han: 1 })
    if (k === 33) y.push({ name: '役牌 中', han: 1 })
    if (k === windKind(ctx.seatWind)) y.push({ name: '自風牌', han: 1 })
    if (k === windKind(ctx.roundWind)) y.push({ name: '場風牌', han: 1 })
  }

  // 三色同順・一気通貫
  const starts = new Set(shuntsu.map((b) => b.kinds[0]))
  for (let r = 0; r < 7; r++) {
    if (starts.has(r) && starts.has(r + 9) && starts.has(r + 18)) {
      y.push({ name: '三色同順', han: menzen ? 2 : 1 })
      break
    }
  }
  for (const s of [0, 9, 18]) {
    if (starts.has(s) && starts.has(s + 3) && starts.has(s + 6)) {
      y.push({ name: '一気通貫', han: menzen ? 2 : 1 })
      break
    }
  }

  // 混全帯么九・純全帯么九(順子が1つ以上あるとき)
  if (shuntsu.length > 0 && blocks.every((b) => b.kinds.some(isYaochu))) {
    if (blocks.every((b) => b.kinds.some(isTerminal))) y.push({ name: '純全帯么九', han: menzen ? 3 : 2 })
    else y.push({ name: '混全帯么九', han: menzen ? 2 : 1 })
  }

  // 対々和・三暗刻・三色同刻・三槓子
  if (triplets.length === 4) y.push({ name: '対々和', han: 2 })
  if (triplets.filter((b) => !b.open).length === 3) y.push({ name: '三暗刻', han: 2 })
  const tripletKinds = new Set(triplets.map((b) => b.kinds[0]))
  for (let r = 0; r < 9; r++) {
    if (tripletKinds.has(r) && tripletKinds.has(r + 9) && tripletKinds.has(r + 18)) {
      y.push({ name: '三色同刻', han: 2 })
      break
    }
  }
  if (triplets.filter((b) => b.type === 'kantsu').length === 3) y.push({ name: '三槓子', han: 2 })

  // 小三元
  if (triplets.filter((b) => isDragon(b.kinds[0])).length === 2 && isDragon(pair.kinds[0])) y.push({ name: '小三元', han: 2 })

  y.push(...colorYaku(env, shuntsu.length > 0))
  return y
}

/** 通常形の符 */
function normalFu(env: Env, blocks: Block[], wait: WaitType, pinfu: boolean): { items: FuItem[]; raw: number } {
  const { ctx, menzen } = env
  const F = RULES.fu
  if (pinfu && ctx.tsumo) return { items: [{ label: '副底(平和のツモ)', fu: F.pinfuTsumo }], raw: F.pinfuTsumo }
  const items: FuItem[] = [{ label: '副底', fu: F.base }]
  if (menzen && !ctx.tsumo) items.push({ label: '門前ロン', fu: F.closedRon })
  if (ctx.tsumo) items.push({ label: 'ツモ', fu: F.tsumo })
  for (const b of blocks) {
    if (b.type === 'shuntsu' || b.type === 'pair') continue
    const yaochu = isYaochu(b.kinds[0])
    let fu: number
    let label: string
    if (b.type === 'koutsu') {
      fu = b.open ? 2 : 4
      label = b.open ? '明刻' : '暗刻'
    } else {
      fu = b.open ? 8 : 16
      label = b.open ? '明槓' : '暗槓'
    }
    if (yaochu) fu *= 2
    items.push({ label: `${label}(${yaochu ? '么九牌' : '中張牌'})`, fu })
  }
  const pair = blocks.find((b) => b.type === 'pair')!.kinds[0]
  const isSeat = pair === windKind(ctx.seatWind)
  const isRound = pair === windKind(ctx.roundWind)
  if (isDragon(pair)) items.push({ label: '雀頭(三元牌)', fu: F.valuePair })
  else if (isSeat && isRound) items.push({ label: '雀頭(連風牌)', fu: F.doubleWindPair })
  else if (isSeat) items.push({ label: '雀頭(自風)', fu: F.valuePair })
  else if (isRound) items.push({ label: '雀頭(場風)', fu: F.valuePair })
  if (wait === 'kanchan' || wait === 'penchan' || wait === 'tanki') {
    const names = { kanchan: '嵌張', penchan: '辺張', tanki: '単騎' }
    items.push({ label: `待ち(${names[wait]})`, fu: F.singleWait })
  }
  const raw = items.reduce((s, i) => s + i.fu, 0)
  if (!menzen && !ctx.tsumo && raw === F.base) {
    // 鳴いたピンフ形のロン(符が20符のまま)は30符
    items.push({ label: '鳴いたピンフ形のロン(30符にする)', fu: F.openPinfuRon - F.base })
    return { items, raw: F.openPinfuRon }
  }
  return { items, raw }
}

function isValuePair(env: Env, kind: number): boolean {
  return isDragon(kind) || kind === windKind(env.ctx.seatWind) || kind === windKind(env.ctx.roundWind)
}

function normalCandidates(env: Env): Candidate[] {
  const win = env.input.winTile.kind
  const handCounts = tilesToCounts(env.input.hand)
  const meldBlocks = env.melds.map(meldBlock)
  const result: Candidate[] = []
  for (let p = 0; p < TILE_KINDS; p++) {
    if (handCounts[p] < 2) continue
    handCounts[p] -= 2
    for (const mentsu of splitMentsu(handCounts)) {
      const concealed: Block[] = [{ type: 'pair', kinds: [p, p], open: false, fromMeld: false }, ...mentsu]
      if (concealed.length - 1 + meldBlocks.length !== 4) continue
      // アガリ牌が入っている塊ごとに、待ちの見方が変わる
      concealed.forEach((wb, wi) => {
        if (!wb.kinds.includes(win)) return
        const wait = waitOf(wb, win)
        const blocks: Block[] = [
          ...concealed.map((b, i) => (i === wi && b.type === 'koutsu' && !env.ctx.tsumo ? { ...b, open: true } : b)),
          ...meldBlocks,
        ]
        const sets = blocks.filter((b) => b.type !== 'pair')
        const pinfu =
          env.menzen && env.melds.length === 0 && sets.every((b) => b.type === 'shuntsu') && !isValuePair(env, p) && wait === 'ryanmen'
        const yakuman = yakumanOf(env, 'normal', blocks)
        const { items, raw } = normalFu(env, blocks, wait, pinfu)
        result.push({
          shape: 'normal',
          blocks,
          wait,
          yaku: yakuman.length > 0 ? [] : normalYaku(env, blocks, pinfu),
          yakuman,
          fuItems: items,
          fuRaw: raw,
          fu: round10(raw),
        })
      })
    }
    handCounts[p] += 2
  }
  return result
}

function chiitoitsuCandidate(env: Env): Candidate | null {
  if (env.melds.length > 0) return null
  const c = tilesToCounts(env.input.hand)
  if (c.filter((n) => n === 2).length !== 7) return null
  const yakuman = yakumanOf(env, 'chiitoitsu', [])
  const yaku = yakuman.length > 0 ? [] : [...situationalYaku(env), { name: '七対子', han: 2 }, ...colorYaku(env, false)]
  return {
    shape: 'chiitoitsu',
    blocks: [],
    wait: 'tanki',
    yaku,
    yakuman,
    fuItems: [{ label: '七対子(固定)', fu: RULES.fu.chiitoitsu }],
    fuRaw: RULES.fu.chiitoitsu,
    fu: RULES.fu.chiitoitsu,
  }
}

const YAOCHU_KINDS = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]

function kokushiCandidate(env: Env): Candidate | null {
  if (env.melds.length > 0) return null
  const c = tilesToCounts(env.input.hand)
  const ok = YAOCHU_KINDS.every((k) => c[k] >= 1) && YAOCHU_KINDS.filter((k) => c[k] === 2).length === 1 && c.reduce((a, b) => a + b, 0) === 14
  if (!ok) return null
  return {
    shape: 'kokushi',
    blocks: [],
    wait: null,
    yaku: [],
    yakuman: yakumanOf(env, 'kokushi', []),
    fuItems: [],
    fuRaw: 0,
    fu: 0,
  }
}

// ---- 点数 ----

interface Points {
  limit: LimitName | null
  basePoints: number
}

function basePointsOf(han: number, fu: number, yakumanMultiplier: number): Points {
  if (yakumanMultiplier > 0) return { limit: 'yakuman', basePoints: 8000 * yakumanMultiplier }
  const L = RULES.limitHan
  if (han >= L.sanbaiman) return { limit: 'sanbaiman', basePoints: 6000 }
  if (han >= L.baiman) return { limit: 'baiman', basePoints: 4000 }
  if (han >= L.haneman) return { limit: 'haneman', basePoints: 3000 }
  if (han >= L.mangan) return { limit: 'mangan', basePoints: 2000 }
  const base = fu * 2 ** (han + 2)
  // 切り上げ満貫: 30符4翻・60符3翻
  if (RULES.kiriageMangan && ((fu === 30 && han === 4) || (fu === 60 && han === 3))) return { limit: 'mangan', basePoints: 2000 }
  if (base >= 2000) return { limit: 'mangan', basePoints: 2000 }
  return { limit: null, basePoints: base }
}

function paymentOf(base: number, dealer: boolean, tsumo: boolean): Pick<ScoreResult, 'payment' | 'points'> {
  if (!tsumo) {
    const p = ceil100(base * (dealer ? 6 : 4))
    return { payment: { type: 'ron', fromDiscarder: p }, points: p }
  }
  if (dealer) {
    const each = ceil100(base * 2)
    return { payment: { type: 'tsumo', fromDealer: null, fromNonDealer: each }, points: each * 3 }
  }
  const fromDealer = ceil100(base * 2)
  const fromNonDealer = ceil100(base)
  return { payment: { type: 'tsumo', fromDealer, fromNonDealer }, points: fromDealer + fromNonDealer * 2 }
}

function doraItems(env: Env): YakuItem[] {
  const { ctx, allTiles } = env
  const count = (indicators: Tile[] | undefined) =>
    (indicators ?? []).reduce((sum, ind) => {
      const d = doraFromIndicator(ind.kind)
      return sum + allTiles.filter((t) => t.kind === d).length
    }, 0)
  const items: YakuItem[] = []
  const dora = count(ctx.doraIndicators)
  if (dora > 0) items.push({ name: 'ドラ', han: dora })
  if (ctx.riichi || ctx.doubleRiichi) {
    const ura = count(ctx.uraDoraIndicators)
    if (ura > 0) items.push({ name: '裏ドラ', han: ura })
  }
  const aka = allTiles.filter((t) => t.red).length
  if (aka > 0) items.push({ name: '赤ドラ', han: aka })
  return items
}

function validate(input: ScoreInput): string | null {
  const melds = input.melds ?? []
  const { ctx } = { ctx: input.context }
  if (input.hand.length + melds.length * 3 !== 14) return `手牌の枚数が正しくありません(手牌${input.hand.length}枚・副露${melds.length}つ)`
  if (!input.hand.some((t) => t.kind === input.winTile.kind)) return 'アガリ牌が手牌に入っていません'
  for (const m of melds) {
    const n = m.type === 'chi' || m.type === 'pon' ? 3 : 4
    if (m.tiles.length !== n) return '副露の枚数が正しくありません'
  }
  if (melds.some((m) => m.type !== 'ankan') && (ctx.riichi || ctx.doubleRiichi)) return '鳴いているとリーチできません'
  if (ctx.ippatsu && !(ctx.riichi || ctx.doubleRiichi)) return '一発はリーチしたときだけです'
  if ((ctx.haitei || ctx.rinshan || ctx.tenhou || ctx.chiihou) && !ctx.tsumo) return '海底摸月・嶺上開花・天和・地和はツモのときだけです'
  if ((ctx.houtei || ctx.chankan) && ctx.tsumo) return '河底撈魚・搶槓はロンのときだけです'
  if (ctx.rinshan && !melds.some((m) => m.type !== 'chi' && m.type !== 'pon')) return '嶺上開花はカンしたときだけです'
  if (ctx.tenhou && ctx.seatWind !== 1) return '天和は親だけです'
  if (ctx.chiihou && ctx.seatWind === 1) return '地和は子だけです'
  const all = [...input.hand, ...melds.flatMap((m) => m.tiles)]
  if (tilesToCounts(all).some((n) => n > 4)) return '同じ牌が5枚以上あります'
  return null
}

/** 役・符・点数を計算する。アガリの形でない・役がない場合は ok: false */
export function calculateScore(input: ScoreInput): ScoreResult | ScoreFailure {
  const error = validate(input)
  if (error) return { ok: false, reason: error }
  const melds = input.melds ?? []
  const allTiles = [...input.hand, ...melds.flatMap((m) => m.tiles)]
  const env: Env = {
    input,
    ctx: input.context,
    allTiles,
    allKinds: allTiles.map((t) => t.kind),
    counts: tilesToCounts(allTiles),
    menzen: melds.every((m) => m.type === 'ankan'),
    melds,
    dealer: input.context.seatWind === 1,
  }

  const candidates: Candidate[] = [...normalCandidates(env)]
  const chiitoi = chiitoitsuCandidate(env)
  if (chiitoi) candidates.push(chiitoi)
  const kokushi = kokushiCandidate(env)
  if (kokushi) candidates.push(kokushi)
  if (candidates.length === 0) return { ok: false, reason: 'アガリの形ではありません' }

  const dora = doraItems(env)
  let best: ScoreResult | null = null
  for (const c of candidates) {
    const multiplier = c.yakuman.reduce((s, y) => s + y.multiplier, 0)
    if (multiplier === 0 && c.yaku.length === 0) continue
    const yakuHan = c.yaku.reduce((s, y) => s + y.han, 0)
    const han = multiplier > 0 ? 0 : yakuHan + dora.reduce((s, d) => s + d.han, 0)
    const { limit, basePoints } = basePointsOf(han, c.fu, multiplier)
    const pay = paymentOf(basePoints, env.dealer, env.ctx.tsumo)
    const honba = env.ctx.honba ?? 0
    const honbaPoints = honba * 300
    const riichiStickPoints = (env.ctx.riichiSticks ?? 0) * 1000
    const label =
      multiplier > 0
        ? multiplier === 1
          ? '役満'
          : `${multiplier}倍役満`
        : `${c.fu}符${han}翻${limit ? ` ${LIMIT_LABELS[limit]}` : ''}`
    const result: ScoreResult = {
      ok: true,
      shape: c.shape,
      blocks: c.blocks.map((b) => ({ type: b.type, kinds: b.kinds, open: b.open })),
      wait: c.wait,
      yaku: c.yaku,
      dora: multiplier > 0 ? [] : dora,
      yakuman: c.yakuman,
      han,
      fu: c.fu,
      fuRaw: c.fuRaw,
      fuItems: c.fuItems,
      limit,
      label,
      basePoints,
      dealer: env.dealer,
      ...pay,
      honbaPoints,
      riichiStickPoints,
      total: pay.points + honbaPoints + riichiStickPoints,
    }
    if (
      !best ||
      result.points > best.points ||
      (result.points === best.points && (result.han > best.han || (result.han === best.han && result.fu > best.fu)))
    ) {
      best = result
    }
  }
  if (!best) return { ok: false, reason: '役がありません(ドラだけではアガれません)' }
  return best
}

/** ツモのときの本場込みの支払い(1人あたり) */
export function honbaPerPayer(result: ScoreResult): number {
  const honba = result.honbaPoints / 300
  return result.payment.type === 'ron' ? honba * 300 : honba * 100
}

/** 切り上げ満貫(30符4翻・60符3翻)の対象か */
export function isKiriageMangan(han: number, fu: number): boolean {
  return RULES.kiriageMangan && ((fu === 30 && han === 4) || (fu === 60 && han === 3))
}

export interface PointsTableEntry {
  limit: LimitName | null
  basePoints: number
  /** ロンの点数 */
  ron: number
  /** ツモの支払い(親のアガリは fromDealer が null) */
  tsumo: { fromDealer: number | null; fromNonDealer: number }
  /** ツモの合計 */
  tsumoTotal: number
}

/** 翻・符・親子から点数を求める(早見表・解説用。役満は yakumanMultiplier に倍数を渡す) */
export function pointsFor(han: number, fu: number, dealer: boolean, yakumanMultiplier = 0): PointsTableEntry {
  const { limit, basePoints } = basePointsOf(han, fu, yakumanMultiplier)
  const ron = paymentOf(basePoints, dealer, false)
  const tsumo = paymentOf(basePoints, dealer, true)
  const t = tsumo.payment as { type: 'tsumo'; fromDealer: number | null; fromNonDealer: number }
  return { limit, basePoints, ron: ron.points, tsumo: { fromDealer: t.fromDealer, fromNonDealer: t.fromNonDealer }, tsumoTotal: tsumo.points }
}

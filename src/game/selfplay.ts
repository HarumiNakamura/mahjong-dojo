// CPU同士の自動対局(画面なし)と成績の集計
//
// 対局の進行は majiang-core の Game、CPU は majiang-ai を使う。
// 終局の処理(順位・ポイント)は Mリーグのルールに合わせて result.ts で自前に計算する。

import Majiang, { type Paipu, type Player } from '@kobalab/majiang-core'
import { createRng } from '../engine/random'
import { finalResult, type FinalResult } from './result'
import { MLEAGUE_RULE } from './rule'

/** Mリーグの終局処理を使う Game */
export class MleagueGame extends Majiang.Game {
  /** 自前で計算した最終成績 */
  final: FinalResult | null = null

  jieju() {
    const model = this._model
    const result = finalResult(model.defen, model.qijia, model.lizhibang)
    model.lizhibang = 0
    this.final = result
    this._paipu.defen = result.scores
    this._paipu.rank = result.ranks
    this._paipu.point = result.points10.map((p) => (p / 10).toFixed(1))
    const paipu = { jieju: this._paipu }
    this.call_players('jieju', [0, 1, 2, 3].map(() => JSON.parse(JSON.stringify(paipu))), this._wait)
    this._view?.summary(this._paipu)
    this._handler?.()
  }
}

/** fn の間だけ Math.random をシード付きの乱数にする(牌山を再現できるように) */
export function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random
  Math.random = createRng(seed)
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

/** CPU 4人で半荘を1回、最後まで同期的に打つ */
export function playCpuHanchan(makePlayer: () => Player, seed: number): { paipu: Paipu; final: FinalResult } {
  return withSeed(seed, () => {
    const players = [0, 1, 2, 3].map(makePlayer)
    let paipu: Paipu | null = null
    const game = new MleagueGame(players, (p) => (paipu = p), MLEAGUE_RULE)
    game.do_sync()
    if (!paipu || !game.final) throw new Error('半荘が終わりませんでした')
    return { paipu, final: game.final }
  })
}

// ---- 成績の集計 ----

export interface PlayerStats {
  hanchan: number
  kyoku: number
  hule: number
  /** 放銃(ロンされた回数) */
  fangchong: number
  lizhi: number
  /** 副露した局の数 */
  fulouKyoku: number
  rankSum: number
  ranks: [number, number, number, number]
  /** アガリの点数の合計(本場・供託を含まない) */
  huleDefen: number
}

const emptyStats = (): PlayerStats => ({
  hanchan: 0,
  kyoku: 0,
  hule: 0,
  fangchong: 0,
  lizhi: 0,
  fulouKyoku: 0,
  rankSum: 0,
  ranks: [0, 0, 0, 0],
  huleDefen: 0,
})

type LogEvent = Record<string, Record<string, unknown> | undefined>

/** 牌譜から、プレイヤー(座席 0〜3)ごとの成績を足し込む */
export function addPaipuStats(stats: PlayerStats[], paipu: Paipu) {
  for (let id = 0; id < 4; id++) {
    stats[id].hanchan++
    stats[id].rankSum += paipu.rank[id]
    stats[id].ranks[paipu.rank[id] - 1]++
  }
  for (const kyoku of paipu.log as LogEvent[][]) {
    const qipai = kyoku[0].qipai as { jushu: number }
    // その局の座席 l のプレイヤー
    const idOf = (l: number) => (paipu.qijia + qipai.jushu + l) % 4
    const lizhi = new Set<number>()
    const fulou = new Set<number>()
    for (const e of kyoku) {
      if (e.dapai && String(e.dapai.p).endsWith('*')) lizhi.add(e.dapai.l as number)
      if (e.fulou) fulou.add(e.fulou.l as number)
      if (e.hule) {
        stats[idOf(e.hule.l as number)].hule++
        stats[idOf(e.hule.l as number)].huleDefen += e.hule.defen as number
        if (e.hule.baojia !== null && e.hule.baojia !== undefined) stats[idOf(e.hule.baojia as number)].fangchong++
      }
    }
    for (let l = 0; l < 4; l++) {
      stats[idOf(l)].kyoku++
      if (lizhi.has(l)) stats[idOf(l)].lizhi++
      if (fulou.has(l)) stats[idOf(l)].fulouKyoku++
    }
  }
}

export function newStats(): PlayerStats[] {
  return [0, 1, 2, 3].map(emptyStats)
}

/** 全員分をまとめた成績 */
export function mergeStats(stats: readonly PlayerStats[]): PlayerStats {
  const m = emptyStats()
  for (const s of stats) {
    for (const k of ['hanchan', 'kyoku', 'hule', 'fangchong', 'lizhi', 'fulouKyoku', 'rankSum', 'huleDefen'] as const) m[k] += s[k]
    s.ranks.forEach((n, i) => (m.ranks[i] += n))
  }
  return m
}

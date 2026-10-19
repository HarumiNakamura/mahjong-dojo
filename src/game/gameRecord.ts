// CPU対戦の1半荘を、学習記録の対局成績(GameRecord)にする

import type { Paipu } from '@kobalab/majiang-core'
import type { GameRecord } from '../engine/records'
import type { FinalResult } from './result'
import { addPaipuStats, newStats } from './selfplay'

/** 自分(プレイヤー 0)の成績を取り出す */
export function gameRecordOf(paipu: Paipu, final: FinalResult, cpu: string, playedAt: Date, id: string): GameRecord {
  const stats = newStats()
  addPaipuStats(stats, paipu)
  const me = stats[0]
  return {
    id,
    playedAt: playedAt.toISOString(),
    cpu,
    rank: final.ranks[0],
    points10: final.points10[0],
    score: final.scores[0],
    kyoku: me.kyoku,
    hule: me.hule,
    fangchong: me.fangchong,
    lizhi: me.lizhi,
    fulouKyoku: me.fulouKyoku,
    huleDefen: me.huleDefen,
  }
}

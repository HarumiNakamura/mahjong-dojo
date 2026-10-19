// CPU対戦の牌譜の保存データ(直近20半荘)。形の確認と、読み込んだ牌譜との合わせ方

import type { Paipu } from '@kobalab/majiang-core'

/** 保存する牌譜の上限(半荘の数) */
export const MAX_PAIPU = 20

export interface PaipuRecord {
  /** 対局成績(GameRecord)と同じ id */
  id: string
  playedAt: string
  paipu: Paipu
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function validPaipu(v: unknown): v is Paipu {
  if (!isObject(v)) return false
  return (
    typeof v.title === 'string' &&
    Array.isArray(v.player) &&
    v.player.length === 4 &&
    typeof v.qijia === 'number' &&
    Array.isArray(v.log) &&
    v.log.length > 0 &&
    v.log.every((k) => Array.isArray(k) && k.length > 0 && isObject(k[0]) && isObject(k[0].qipai)) &&
    Array.isArray(v.defen) &&
    Array.isArray(v.rank)
  )
}

function validRecord(v: unknown): v is PaipuRecord {
  return isObject(v) && typeof v.id === 'string' && typeof v.playedAt === 'string' && !Number.isNaN(Date.parse(v.playedAt)) && validPaipu(v.paipu)
}

/** 保存されていた牌譜を確かめる(形が違うものは捨てる) */
export function sanitizePaipuRecords(value: unknown): PaipuRecord[] {
  return Array.isArray(value) ? value.filter(validRecord) : []
}

/** 牌譜を合わせる(同じ id は1つ、日時の順、新しい20半荘だけ残す) */
export function mergePaipuRecords(current: readonly PaipuRecord[], incoming: readonly PaipuRecord[]): PaipuRecord[] {
  const ids = new Set(current.map((r) => r.id))
  const all = [...current, ...incoming.filter((r) => !ids.has(r.id))].sort((a, b) => a.playedAt.localeCompare(b.playedAt))
  return all.slice(Math.max(0, all.length - MAX_PAIPU))
}

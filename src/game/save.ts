// CPU対戦の途中保存の形を確かめる(壊れたデータで対局が止まらないように)

import type { GameSave } from './selfplay'

const isInt = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

export function parseGameSave(value: unknown): GameSave | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (v.version !== 1) return null
  if (!isInt(v.qijia, 0, 3) || !isInt(v.zhuangfeng, 0, 3) || !isInt(v.jushu, 0, 3)) return null
  if (!isInt(v.changbang, 0, 99) || !isInt(v.lizhibang, 0, 99)) return null
  if (!Array.isArray(v.defen) || v.defen.length !== 4 || !v.defen.every((d) => typeof d === 'number' && Number.isFinite(d))) return null
  if (!Array.isArray(v.log) || !v.log.every((k) => Array.isArray(k))) return null
  if (v.marks !== undefined && !(Array.isArray(v.marks) && v.marks.every((m) => typeof m === 'object' && m !== null && isInt(m.kyoku, 0, 99) && isInt(m.step, 0, 9999)))) {
    return null
  }
  if (v.cpu !== undefined && typeof v.cpu !== 'string') return null
  if (v.practice !== undefined && typeof v.practice !== 'boolean') return null
  // 持ち点と供託の合計は 100,000点
  const total = (v.defen as number[]).reduce((a, b) => a + b, 0) + (v.lizhibang as number) * 1000
  if (total !== 100000) return null
  return v as unknown as GameSave
}

/** 「東2局 1本場」のような表示 */
export function describeSave(save: GameSave): string {
  return `${['東', '南', '西', '北'][save.zhuangfeng]}${save.jushu + 1}局 ${save.changbang}本場`
}

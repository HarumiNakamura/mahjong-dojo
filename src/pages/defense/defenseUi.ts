// 守備のドリルの画面で使う小さな関数と表示名

import type { DangerCategory } from '../../engine/danger'

export const CATEGORY_SHORT: Record<DangerCategory, string> = {
  genbutsu: '現',
  honor: '字',
  suji: 'ス',
  ryousuji: '両',
  sengenSuji: '宣',
  katasuji: '片',
  noChance: 'ノ',
  oneChance: 'ワ',
  musuji: '無',
}

/** 危険度(%)を4段階に分ける(色分け用) */
export function dangerLevel(danger: number): 'safe' | 'low' | 'mid' | 'high' {
  if (danger === 0) return 'safe'
  if (danger < 4) return 'low'
  if (danger < 8) return 'mid'
  return 'high'
}

/** order の from 番目を to 番目へ動かした新しい並び */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}


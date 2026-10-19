// 今日の練習の5問のキーを、その日のうちだけブラウザに覚えておく
//
// ホームで「今日は何問解いたか」を数えるのに使う(ホームで5問を作り直すと時間がかかるため)。
// 今日のキーがなければ、今日はまだ「今日の練習」を開いていない(0問)とわかる。

import { detectStorage } from './records/recordsStore'

const KEY = 'mahjong-dojo:daily-keys'

export interface DailyKeys {
  date: string
  /** `${ドリル}\n${問題のキー}` の一覧 */
  keys: string[]
}

export function saveDailyKeys(value: DailyKeys) {
  try {
    detectStorage()?.setItem(KEY, JSON.stringify(value))
  } catch {
    // 保存できなくても困らない(ホームの表示が0問になるだけ)
  }
}

export function loadDailyKeys(date: string): string[] | null {
  try {
    const raw = typeof window === 'undefined' ? null : detectStorage()?.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<DailyKeys>
    return v.date === date && Array.isArray(v.keys) ? v.keys.filter((k): k is string => typeof k === 'string') : null
  } catch {
    return null
  }
}

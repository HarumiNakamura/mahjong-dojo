import { useState } from 'react'
import { detectStorage } from './records/recordsStore'

/**
 * ブラウザに保存される設定(オン/オフなど)。
 * 保存できない環境(プライベートブラウズなど)では、ページを開いている間だけ覚える。
 */
export function usePersistentSetting<T extends string | number | boolean>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const storage = typeof window === 'undefined' ? null : detectStorage()
    try {
      const raw = storage?.getItem(key)
      if (raw === null || raw === undefined) return defaultValue
      const parsed = JSON.parse(raw) as unknown
      return typeof parsed === typeof defaultValue ? (parsed as T) : defaultValue
    } catch {
      return defaultValue
    }
  })
  const update = (next: T) => {
    setValue(next)
    try {
      detectStorage()?.setItem(key, JSON.stringify(next))
    } catch {
      // 保存できなくても、画面上の設定は変える
    }
  }
  return [value, update]
}

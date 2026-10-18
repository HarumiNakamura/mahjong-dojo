// 学習記録の保存先(ブラウザの localStorage)
// localStorage が使えない環境(プライベートブラウズ・容量オーバーなど)でもサイトが壊れないよう、
// 失敗したらメモリの中だけで記録を持ち、画面に「保存できない」ことを知らせる。

import { emptyRecords, sanitizeRecords, type RecordsData } from '../../engine/records'

export const RECORDS_STORAGE_KEY = 'mahjong-dojo:records'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** localStorage が読み書きできるか確かめて返す。使えなければ null */
export function detectStorage(get: () => StorageLike | undefined = () => window.localStorage): StorageLike | null {
  try {
    const storage = get()
    if (!storage) return null
    const probe = 'mahjong-dojo:probe'
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

export interface RecordsSnapshot {
  data: RecordsData
  /** ブラウザに保存できる状態か */
  persistent: boolean
  /** 直前の保存に失敗した(容量オーバーなど) */
  saveFailed: boolean
}

export interface RecordsStore {
  getSnapshot(): RecordsSnapshot
  subscribe(listener: () => void): () => void
  update(fn: (data: RecordsData) => RecordsData): void
  /** 別のタブなどで保存先が書き換わったときに読み直す */
  reload(): void
}

export function createRecordsStore(storage: StorageLike | null): RecordsStore {
  const listeners = new Set<() => void>()
  const load = (): RecordsData => {
    if (!storage) return emptyRecords()
    try {
      const raw = storage.getItem(RECORDS_STORAGE_KEY)
      return raw ? sanitizeRecords(JSON.parse(raw)) : emptyRecords()
    } catch {
      return emptyRecords()
    }
  }
  let snapshot: RecordsSnapshot = { data: load(), persistent: storage !== null, saveFailed: false }
  const emit = () => listeners.forEach((l) => l())

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    update(fn) {
      const data = fn(snapshot.data)
      let saveFailed = false
      if (storage) {
        try {
          storage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(data))
        } catch {
          saveFailed = true
        }
      }
      snapshot = { ...snapshot, data, saveFailed }
      emit()
    },
    reload() {
      snapshot = { ...snapshot, data: load() }
      emit()
    },
  }
}

let shared: RecordsStore | null = null

/** サイト全体で使う記録の保存先 */
export function getRecordsStore(): RecordsStore {
  if (!shared) {
    shared = createRecordsStore(typeof window === 'undefined' ? null : detectStorage())
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === RECORDS_STORAGE_KEY) shared?.reload()
      })
    }
  }
  return shared
}

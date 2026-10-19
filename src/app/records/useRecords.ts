import { useSyncExternalStore } from 'react'
import type { RecordsData } from '../../engine/records'
import { getRecordsStore, type RecordsSnapshot } from './recordsStore'

const SERVER_SNAPSHOT: RecordsSnapshot = {
  data: { version: 1, attempts: [], favorites: [], games: [], bookmarks: [] },
  persistent: false,
  saveFailed: false,
}

/** 学習記録を読み、書き換える */
export function useRecords(): RecordsSnapshot & { update: (fn: (data: RecordsData) => RecordsData) => void } {
  const store = getRecordsStore()
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, () => SERVER_SNAPSHOT)
  return { ...snapshot, update: store.update }
}

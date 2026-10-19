// CPU対戦の牌譜の保存先(localStorage)。使えない環境では保存しないだけにする

import { mergePaipuRecords, sanitizePaipuRecords, type PaipuRecord } from '../game/paipuRecords'
import { detectStorage } from './records/recordsStore'

const KEY = 'mahjong-dojo:paipu'

export function loadPaipuRecords(): PaipuRecord[] {
  try {
    const raw = typeof window === 'undefined' ? null : detectStorage()?.getItem(KEY)
    return raw ? sanitizePaipuRecords(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

/** 牌譜を保存する。容量が足りなければ古いものから減らして保存し直す */
function store(records: PaipuRecord[]) {
  const storage = detectStorage()
  if (!storage) return
  for (let list = records; list.length > 0; list = list.slice(1)) {
    try {
      storage.setItem(KEY, JSON.stringify(list))
      return
    } catch {
      // 容量オーバー: 1つ減らしてもう一度
    }
  }
}

/** 牌譜を足す(新しい20半荘だけ残す) */
export function addPaipuRecords(records: readonly PaipuRecord[]) {
  store(mergePaipuRecords(loadPaipuRecords(), records))
}

export function clearPaipuRecords() {
  try {
    detectStorage()?.removeItem(KEY)
  } catch {
    // 何もしない
  }
}

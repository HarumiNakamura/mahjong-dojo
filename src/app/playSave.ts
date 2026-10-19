// CPU対戦の途中保存(ブラウザの localStorage)。使えない環境では保存しないだけにする

import { parseGameSave } from '../game/save'
import type { GameSave } from '../game/selfplay'
import { detectStorage } from './records/recordsStore'

const KEY = 'mahjong-dojo:play-save'

export function loadGameSave(): GameSave | null {
  try {
    const raw = typeof window === 'undefined' ? null : detectStorage()?.getItem(KEY)
    return raw ? parseGameSave(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function storeGameSave(save: GameSave) {
  try {
    detectStorage()?.setItem(KEY, JSON.stringify(save))
  } catch {
    // 保存できなくても対局は続ける
  }
}

export function clearGameSave() {
  try {
    detectStorage()?.removeItem(KEY)
  } catch {
    // 何もしない
  }
}

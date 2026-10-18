// 小さなルーター: URL のパスでページを切り替える(ライブラリは使わない)
import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()

/** 末尾の / を取り除く("/practice/" → "/practice") */
export function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

/** 今のページのパス */
export function usePath(): string {
  return useSyncExternalStore(
    subscribe,
    () => normalizePath(window.location.pathname),
    () => '/',
  )
}

/** ページを移動する(ブラウザの「戻る」で戻れる) */
export function navigate(to: string) {
  if (normalizePath(to) !== normalizePath(window.location.pathname)) {
    window.history.pushState(null, '', to)
    listeners.forEach((l) => l())
  }
  window.scrollTo(0, 0)
}

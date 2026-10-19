// 小さなルーター: URL のパスでページを切り替える(ライブラリは使わない)
import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()

/** ビルド時に HTML を作るときのパス(ブラウザでは使わない) */
let serverPath = '/'
export function setServerPath(path: string) {
  serverPath = normalizePath(path)
}

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
    // ビルド時の HTML 作りでは指定のパス、ブラウザで HTML を引き継ぐときは今のパス
    () => (typeof window === 'undefined' ? serverPath : normalizePath(window.location.pathname)),
  )
}

/** ページの中の目印(#id)までスクロールする。ページの読み込みを待つため、見つかるまで少し待つ */
export function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  let tries = 0
  const tick = () => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ block: 'start' })
    else if (tries++ < 40) window.setTimeout(tick, 50)
  }
  tick()
}

/** ページを移動する(ブラウザの「戻る」で戻れる)。#目印 があればそこまでスクロールする */
export function navigate(to: string) {
  const [path, hash] = to.split('#')
  if (normalizePath(path) !== normalizePath(window.location.pathname) || (hash !== undefined && `#${hash}` !== window.location.hash)) {
    window.history.pushState(null, '', to)
    listeners.forEach((l) => l())
  }
  if (hash) scrollToHash(hash)
  else window.scrollTo(0, 0)
}

/** 今の URL のクエリ(?a=1&b=2)を読む。ページを開いたときの値を使う */
export function readQuery(): URLSearchParams {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}

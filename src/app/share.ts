// 問題の共有: 問題データを URL に入れて、同じ問題を開けるようにする
//
// 共有 URL は /q/<ドリルの id>?d=<問題データ>。問題データは JSON を UTF-8 にして base64url で書く。

/** JSON にできる値を、URL に入れられる文字列にする */
export function encodeShareData(data: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** encodeShareData の逆。読めなければエラーを投げる */
export function decodeShareData(text: string): unknown {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

/** 共有ページのパス(例: /q/efficiency) */
export const sharePagePath = (drillId: string) => `/q/${drillId}`

/** 問題を開くためのパス(クエリつき) */
export function sharePath(drillId: string, data: unknown): string {
  return `${sharePagePath(drillId)}?d=${encodeShareData(data)}`
}

/** X(旧Twitter)に投稿する画面の URL */
export function xIntentUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

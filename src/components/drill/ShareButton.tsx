import { useState } from 'react'
import { xIntentUrl } from '../../app/share'

interface Props {
  /** 共有する URL のパス(/q/… の形) */
  path: string
  /** X に投稿するときの文 */
  text: string
}

/** 「この問題を共有」: URL のコピーと X への投稿 */
export function ShareButton({ path, text }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${path}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // クリップボードが使えないときは、URL の欄を選んで手でコピーしてもらう
      setCopied(false)
      document.getElementById('share-url')?.focus()
    }
  }

  return (
    <div className="share">
      <button type="button" className="drill-favorite" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span aria-hidden="true">↗</span>この問題を共有
      </button>
      {open && (
        <div className="share-panel">
          <label className="share-label" htmlFor="share-url">
            この URL を開くと、同じ問題が出ます
          </label>
          <input id="share-url" className="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <div className="share-actions">
            <button type="button" className="button" onClick={copy}>
              {copied ? 'コピー済み' : 'URLをコピー'}
            </button>
            <a className="button" href={xIntentUrl(text, url)} target="_blank" rel="noopener noreferrer">
              Xに投稿
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

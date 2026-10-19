import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '../../app/Link'
import { findTerm, termHref } from '../../content/terms'
import { parseTiles } from '../../engine/tiles'
import { Tile } from '../tile/Tile'
import './term.css'

const GAP = 6
const MARGIN = 8

/**
 * 用語部品。点線の下線で示し、タップ(PCはクリック)で小さな吹き出しに
 * 読み・一言の意味・牌の例・詳しい説明へのリンクを出す。
 * HTML としては用語集の該当箇所へのふつうのリンク(JavaScript がなくても、検索エンジンからも辿れる)。
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const term = findTerm(id)
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLAnchorElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const popupId = useId()

  // 開いたら、画面からはみ出さない位置に置く(下に入らなければ上に出す)
  useLayoutEffect(() => {
    if (!open || !anchor.current || !popup.current) return
    const a = anchor.current.getBoundingClientRect()
    const p = popup.current.getBoundingClientRect()
    const left = Math.min(Math.max(MARGIN, a.left + a.width / 2 - p.width / 2), window.innerWidth - p.width - MARGIN)
    const below = a.bottom + GAP
    const top = below + p.height <= window.innerHeight - MARGIN || a.top - GAP - p.height < MARGIN ? below : a.top - GAP - p.height
    setPos({ top, left })
    popup.current.focus()
  }, [open])

  // 外側を押す・Esc・スクロールで閉じる
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!popup.current?.contains(t) && !anchor.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        anchor.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
    }
  }, [open])

  if (!term) return <>{children}</>
  const href = termHref(term)

  return (
    <>
      <a
        ref={anchor}
        href={href}
        className="term"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          setPos(null)
          setOpen((v) => !v)
        }}
      >
        {children ?? term.word}
      </a>
      {open &&
        createPortal(
          <div
            ref={popup}
            id={popupId}
            role="dialog"
            aria-label={`用語: ${term.word}`}
            tabIndex={-1}
            className="term-popup"
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
          >
            <p className="term-popup-head">
              <strong>{term.word}</strong>
              <span className="term-popup-reading">{term.reading}</span>
            </p>
            <p className="term-popup-meaning">{term.meaning}</p>
            {term.tiles && (
              <span className="term-popup-tiles" aria-label={`牌の例: ${term.tiles}`}>
                {parseTiles(term.tiles).map((t, i) => (
                  <Tile key={i} tile={t} showLabel={false} />
                ))}
              </span>
            )}
            <p className="term-popup-links">
              {term.article && (
                <Link to={term.article} onClick={() => setOpen(false)}>
                  詳しい説明
                </Link>
              )}
              <Link to={href} onClick={() => setOpen(false)}>
                用語集で見る
              </Link>
            </p>
          </div>,
          document.body,
        )}
    </>
  )
}

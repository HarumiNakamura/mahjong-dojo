import { useEffect, useRef } from 'react'
import { tileName, type Tile as TileData } from '../../engine/tiles'
import { Tile } from './Tile'

interface HandProps {
  tiles: readonly TileData[]
  /** ツモ牌(少し離して右端に置く) */
  drawn?: TileData | null
  /** 選択中の位置(ツモ牌は tiles.length) */
  selected?: number | null
  /** 指定するとタップで選択できる */
  onSelect?: (index: number) => void
  /** 指定すると、長押し(マウスは乗せる)でその牌を知らせる。離れたら null(タッチは長押しの結果を残す) */
  onPreview?: (index: number | null) => void
  /** 長押し・マウスで見ている牌の位置 */
  previewed?: number | null
  /** 牌の下に出す短い表示(位置ごと。null なら出さない) */
  captions?: readonly (string | null)[]
  /** 押せない牌(リーチ中など) */
  isDisabled?: (index: number) => boolean
}

const LONG_PRESS_MS = 400

/** 手牌。13〜14枚を横一列に並べ、画面幅に合わせて牌の大きさを変える。 */
export function Hand({ tiles, drawn, selected = null, onSelect, onPreview, previewed = null, captions, isDisabled }: HandProps) {
  const all = drawn ? [...tiles, drawn] : [...tiles]
  const timer = useRef<number | null>(null)
  // 長押しのあとに続くクリック(タップ)は、回答として扱わない
  const longPressed = useRef(false)

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => clearTimer, [])

  return (
    <div className="hand" role={onSelect ? 'group' : undefined} aria-label="手牌">
      {all.map((tile, i) => {
        const isDrawn = drawn != null && i === tiles.length
        const className =
          `hand-tile${isDrawn ? ' hand-tile--drawn' : ''}${selected === i ? ' hand-tile--selected' : ''}` +
          (previewed === i ? ' hand-tile--previewed' : '') +
          (isDisabled?.(i) ? ' hand-tile--disabled' : '')
        const caption = captions?.[i] ? <span className="hand-caption">{captions[i]}</span> : null
        if (!onSelect) {
          return (
            <span key={i} className={className}>
              <Tile tile={tile} />
              {caption}
            </span>
          )
        }
        return (
          <button
            key={i}
            type="button"
            className={className}
            aria-pressed={selected === i}
            disabled={isDisabled?.(i)}
            aria-label={`${tileName(tile)}${isDrawn ? '(ツモ牌)' : ''}`}
            onClick={() => {
              if (longPressed.current) {
                longPressed.current = false
                return
              }
              onSelect(i)
            }}
            onPointerEnter={(e) => {
              if (onPreview && e.pointerType === 'mouse') onPreview(i)
            }}
            onPointerLeave={(e) => {
              clearTimer()
              if (onPreview && e.pointerType === 'mouse') onPreview(null)
            }}
            onPointerDown={(e) => {
              if (!onPreview || e.pointerType === 'mouse') return
              longPressed.current = false
              clearTimer()
              timer.current = window.setTimeout(() => {
                longPressed.current = true
                onPreview(i)
              }, LONG_PRESS_MS)
            }}
            onPointerUp={clearTimer}
            onPointerCancel={clearTimer}
            onContextMenu={(e) => {
              if (onPreview) e.preventDefault()
            }}
          >
            <Tile tile={tile} />
            {caption}
          </button>
        )
      })}
    </div>
  )
}

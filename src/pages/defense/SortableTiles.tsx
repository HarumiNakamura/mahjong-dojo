import { useRef, useState, type PointerEvent } from 'react'
import { Tile } from '../../components/tile/Tile'
import { tileName, type Tile as TileData } from '../../engine/tiles'
import { moveItem } from './defenseUi'

interface Props {
  tiles: readonly TileData[]
  /** 並び順(tiles の位置) */
  order: readonly number[]
  onChange?: (order: number[]) => void
  /** 位置ごとの ○× (回答後) */
  marks?: readonly boolean[]
}

/**
 * 並べ替えできる牌の列(7枚×2段)。
 * 指(マウス)で押したまま動かすと並べ替え、タップで選んでから別の場所をタップしてもその場所へ動く。
 */
export function SortableTiles({ tiles, order, onChange, marks }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const drag = useRef<{ pos: number; x: number; y: number; moved: boolean } | null>(null)
  const disabled = !onChange

  const posAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-pos]')
    return el ? Number(el.dataset.pos) : null
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, pos: number) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { pos, x: e.clientX, y: e.clientY, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || !onChange) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return
    d.moved = true
    setDragging(d.pos)
    setSelected(null)
    const to = posAt(e.clientX, e.clientY)
    if (to !== null && to !== d.pos) {
      onChange(moveItem(order, d.pos, to))
      d.pos = to
      setDragging(to)
    }
  }
  const onPointerUp = (pos: number) => {
    const d = drag.current
    drag.current = null
    setDragging(null)
    if (!d || d.moved) return
    tap(pos)
  }
  // タップ: 1回目で選び、2回目でその場所へ動かす
  const tap = (pos: number) => {
    if (!onChange) return
    if (selected === null) setSelected(pos)
    else {
      if (selected !== pos) onChange(moveItem(order, selected, pos))
      setSelected(null)
    }
  }

  return (
    <div className="sortable">
      <div className="sortable-ends" aria-hidden="true">
        <span>← 安全</span>
        <span>危険 →</span>
      </div>
      <ol className="sortable-grid" aria-label="安全な順の並び">
        {order.map((tileIndex, pos) => {
          const tile = tiles[tileIndex]
          const mark = marks?.[pos]
          const cls =
            'sortable-cell' +
            (selected === pos ? ' sortable-cell--selected' : '') +
            (dragging === pos ? ' sortable-cell--dragging' : '') +
            (mark === true ? ' sortable-cell--ok' : mark === false ? ' sortable-cell--ng' : '')
          return (
            <li key={tileIndex} className="sortable-item">
              <button
                type="button"
                className={cls}
                data-pos={pos}
                disabled={disabled}
                aria-label={`${pos + 1}番目 ${tileName(tile)}${selected === pos ? '(選択中)' : ''}`}
                onPointerDown={(e) => onPointerDown(e, pos)}
                onPointerMove={onPointerMove}
                onPointerUp={() => onPointerUp(pos)}
                onClick={(e) => {
                  // キーボード(Enter・スペース)で押したとき
                  if (e.detail === 0) tap(pos)
                }}
                onPointerCancel={() => {
                  drag.current = null
                  setDragging(null)
                }}
                onKeyDown={(e) => {
                  if (!onChange) return
                  if (e.key === 'ArrowLeft' && pos > 0) onChange(moveItem(order, pos, pos - 1))
                  if (e.key === 'ArrowRight' && pos < order.length - 1) onChange(moveItem(order, pos, pos + 1))
                }}
              >
                <span className="sortable-num">{pos + 1}</span>
                <Tile tile={tile} />
                {mark !== undefined && (
                  <span className="sortable-mark" aria-hidden="true">
                    {mark ? '○' : '×'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

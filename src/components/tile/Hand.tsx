import { useEffect, useRef, useState } from 'react'
import { usePersistentSetting } from '../../app/usePersistentSetting'
import { tileName, type Tile as TileData } from '../../engine/tiles'
import { Tile } from './Tile'

/** 「1回のタップで決定」の設定(ブラウザに保存。全画面で共通) */
export const ONE_TAP_KEY = 'mahjong-dojo:one-tap'

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
  /**
   * 指定すると「牌を1枚選んで決定する」手牌になる(2段階タップ)。
   * 1回目のタップで選び(少し持ち上げる)、同じ牌をもう一度タップするか決定ボタンで onPick を呼ぶ。
   * 設定で「1回のタップで決定」にしていれば、1回目で決定する。selected・onSelect とは一緒に使わない
   */
  onPick?: (index: number) => void
  /** 決定ボタンの文字(牌の名前が前につく。例: 「を切る」→「5萬を切る」) */
  pickLabel?: string
  /** 画面幅いっぱいに大きく並べる(手牌から選ぶ画面。onPick があれば既定でオン) */
  full?: boolean
}

const LONG_PRESS_MS = 400

/** 手牌。13〜14枚を横一列に並べ、画面幅に合わせて牌の大きさを変える。 */
export function Hand(props: HandProps) {
  if (props.onPick) return <PickHand {...props} onPick={props.onPick} />
  return <HandTiles {...props} />
}

/** 2段階タップで1枚選ぶ手牌 */
function PickHand({ onPick, pickLabel = 'を切る', ...props }: HandProps & { onPick: (index: number) => void }) {
  const [oneTap, setOneTap] = usePersistentSetting<boolean>(ONE_TAP_KEY, false)
  const [pending, setPending] = useState<number | null>(null)
  const all = props.drawn ? [...props.tiles, props.drawn] : [...props.tiles]
  // 手牌が変わったら(次の問題・次の巡目)、選びかけの牌は取り消す
  const key = all.map((t) => `${t.kind}${t.red ? 'r' : ''}`).join()
  const [shownKey, setShownKey] = useState(key)
  if (shownKey !== key) {
    setShownKey(key)
    setPending(null)
  }
  const current = pending !== null && pending < all.length && !props.isDisabled?.(pending) ? pending : null
  const pick = (i: number) => {
    setPending(null)
    onPick(i)
  }
  return (
    <div className="hand-pick">
      <HandTiles
        {...props}
        full={props.full ?? true}
        selected={current}
        onSelect={(i) => {
          if (oneTap || current === i) pick(i)
          else setPending(i)
        }}
      />
      {!oneTap && (
        <button type="button" className="button button--primary button--block hand-pick-button" disabled={current === null} onClick={() => current !== null && pick(current)}>
          {current === null ? '牌をタップして選んでください' : `${tileName(all[current])}${pickLabel}`}
        </button>
      )}
      <label className="hand-pick-setting">
        <input type="checkbox" checked={oneTap} onChange={(e) => setOneTap(e.target.checked)} />
        1回のタップで決定する
      </label>
    </div>
  )
}

function HandTiles({ tiles, drawn, selected = null, onSelect, onPreview, previewed = null, captions, isDisabled, full = false }: HandProps) {
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
    <div className={`hand${full ? ' hand--full' : ''}`} role={onSelect ? 'group' : undefined} aria-label="手牌">
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

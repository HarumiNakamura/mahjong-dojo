import { Discards } from '../../components/tile/Discards'
import { SEAT_NAMES, type DefenseSituation } from '../../engine/danger'

interface Props {
  situation: DefenseSituation
  /** 目立たせる河の牌(根拠の牌) */
  highlight?: readonly { seat: number; index: number }[]
}

const WINDS = ['東', '南', '西', '北']
/** 卓の形の並び(座席 0 = 自分、1 = 下家、2 = 対面、3 = 上家)。CPU対戦の画面と同じ */
const AREAS = ['me', 'shimocha', 'toimen', 'kamicha']

/** 4人の河。卓を上から見た形に固定する(対面が上、上家が左、下家が右、自分が下) */
export function DefenseRivers({ situation: s, highlight = [] }: Props) {
  return (
    <div className="def-table">
      <div className="def-rivers">
        {[2, 3, 1, 0].map((seat) => {
          const riichi = s.riichiIndex[seat] !== null
          const marks = new Set(highlight.filter((h) => h.seat === seat).map((h) => h.index))
          const wind = WINDS[(seat - s.dealerSeat + 4) % 4]
          return (
            <div key={seat} className={`def-river def-river--${AREAS[seat]}${riichi ? ' def-river--riichi' : ''}`}>
              <p className="def-river-title">
                <span className="def-wind" aria-label={`${wind}家`}>
                  {wind}
                </span>
                {SEAT_NAMES[seat]}
                {seat === s.dealerSeat && <span className="def-tag">親</span>}
                {riichi && <span className="def-tag def-tag--riichi">リーチ</span>}
              </p>
              {s.rivers[seat].length > 0 ? (
                <Discards tiles={s.rivers[seat].map((r) => r.tile)} riichiIndex={s.riichiIndex[seat]} highlight={marks} />
              ) : (
                <p className="eff-none">まだありません</p>
              )}
            </div>
          )
        })}
      </div>
      <p className="def-order">打つ順:自分 → 下家(右) → 対面(上) → 上家(左)</p>
    </div>
  )
}

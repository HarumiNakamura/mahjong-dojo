import { Discards } from '../../components/tile/Discards'
import { SEAT_NAMES, type DefenseSituation } from '../../engine/danger'

interface Props {
  situation: DefenseSituation
  /** 目立たせる河の牌(根拠の牌) */
  highlight?: readonly { seat: number; index: number }[]
}

/** 4人の河。リーチ者を先に、自分の河を最後に並べる */
export function DefenseRivers({ situation: s, highlight = [] }: Props) {
  const seats = [1, 2, 3].sort((a, b) => Number(s.riichiIndex[b] !== null) - Number(s.riichiIndex[a] !== null) || a - b)
  return (
    <div className="def-rivers">
      {[...seats, 0].map((seat) => {
        const riichi = s.riichiIndex[seat] !== null
        const marks = new Set(highlight.filter((h) => h.seat === seat).map((h) => h.index))
        return (
          <div key={seat} className={`def-river${riichi ? ' def-river--riichi' : ''}`}>
            <p className="def-river-title">
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
  )
}

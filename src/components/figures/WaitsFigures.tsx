// 待ちの種類:5つの基本の待ち / 受け入れ枚数:残り枚数の数え方
import { parseTiles } from '../../engine/tiles'
import { TILE_RATIO, useArrowId } from './geometry'
import { ArrowHead, FigText, FigTile, FigTiles } from './parts'

const WAITS = [
  { name: '両面', shape: '23m', waits: '14m', count: 8 },
  { name: '嵌張', shape: '13m', waits: '2m', count: 4 },
  { name: '辺張', shape: '12m', waits: '3m', count: 4 },
  { name: '双碰', shape: '11m55p', waits: '1m5p', count: 4 },
  { name: '単騎', shape: '7z', waits: '7z', count: 3 },
]

/** 5つの基本の待ち(形 → 待ち牌 → 最大の枚数) */
export function WaitShapesFigure() {
  const arrow = useArrowId()
  const w = 24
  const rowH = 50
  const top = 34
  return (
    <svg viewBox="0 0 360 306" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      <FigText x={10} y={18} size={12} tone="muted" anchor="start">
        待ち
      </FigText>
      <FigText x={74} y={18} size={12} tone="muted" anchor="start">
        形
      </FigText>
      <FigText x={198} y={18} size={12} tone="muted" anchor="start">
        待ち牌
      </FigText>
      <FigText x={258} y={18} size={12} tone="muted" anchor="start">
        最大の枚数
      </FigText>
      {WAITS.map((r, i) => {
        const y = top + i * rowH
        const ty = y + 4
        const nWaits = parseTiles(r.waits).length
        return (
          <g key={r.name}>
            {i > 0 && <line x1={6} y1={y - 8} x2={354} y2={y - 8} className="fig-grid" />}
            <FigText x={10} y={y + 24} size={14} anchor="start" tone={i === 0 ? 'correct' : 'text'} bold>
              {r.name}
            </FigText>
            <FigTiles tiles={r.shape} x={74} y={ty} w={w} />
            <line x1={176} y1={y + 20} x2={192} y2={y + 20} className="fig-line" markerEnd={arrow.url} />
            <rect x={196} y={ty - 3} width={nWaits * w + 6} height={w * TILE_RATIO + 6} rx={3} className="fig-box fig-box--accent" />
            <FigTiles tiles={r.waits} x={199} y={ty} w={w} />
            <rect x={258} y={y + 12} width={r.count * 8} height={14} rx={2} className={i === 0 ? 'fig-safe' : 'fig-danger'} />
            <FigText x={262 + r.count * 8} y={y + 24} size={14} anchor="start" bold>
              {r.count}枚
            </FigText>
          </g>
        )
      })}
      <FigText x={180} y={298} size={12} tone="muted">
        双碰は手の中で2枚ずつ、単騎は1枚使うので残りが少ない
      </FigText>
    </svg>
  )
}

/** 残り枚数の数え方(23索の両面で、河に4索が2枚見えている例) */
export function UkeireCountFigure() {
  const w = 30
  const rows = [
    { tile: '1s', seen: 0, name: '1索' },
    { tile: '4s', seen: 2, name: '4索' },
  ]
  return (
    <svg viewBox="0 0 360 252" className="fig-svg">
      <rect x={6} y={6} width={348} height={34} rx={4} className="fig-panel" />
      <FigText x={180} y={28} size={14} bold>
        残り枚数 = 4枚 − 手牌にある枚数 − 見えている枚数
      </FigText>
      <FigText x={14} y={66} size={13} anchor="start">
        手牌の形:
      </FigText>
      <FigTiles tiles="23s" x={84} y={48} w={26} />
      <FigText x={146} y={66} size={13} anchor="start" tone="muted">
        両面(1索・4索待ち)
      </FigText>
      {rows.map((r, i) => {
        const y = 92 + i * 66
        return (
          <g key={r.tile}>
            <FigText x={14} y={y + 26} size={14} anchor="start" bold>
              {r.name}
            </FigText>
            {[0, 1, 2, 3].map((j) => {
              const gone = j >= 4 - r.seen
              return (
                <g key={j}>
                  <FigTile tile={r.tile} x={56 + j * (w + 6)} y={y} w={w} faded={gone} />
                  {gone && (
                    <FigText x={56 + j * (w + 6) + w / 2} y={y + 54} size={11} tone="accent" bold>
                      河
                    </FigText>
                  )}
                </g>
              )
            })}
            <FigText x={210} y={y + 22} size={13} anchor="start" tone="muted">
              {`4 − 0 − ${r.seen} =`}
            </FigText>
            <FigText x={300} y={y + 24} size={18} anchor="start" tone={r.seen ? 'accent' : 'correct'} bold>
              {4 - r.seen}枚
            </FigText>
          </g>
        )
      })}
      <line x1={14} y1={226} x2={346} y2={226} className="fig-grid" />
      <FigText x={14} y={246} size={14} anchor="start">
        受け入れ枚数 4 + 2 =
      </FigText>
      <FigText x={300} y={246} size={18} anchor="start" tone="accent" bold>
        6枚
      </FigText>
    </svg>
  )
}

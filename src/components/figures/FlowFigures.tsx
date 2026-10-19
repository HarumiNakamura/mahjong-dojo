// 麻雀の基本の流れ:卓を上から見た図・半荘の進み方
import { useArrowId } from './geometry'
import { ArrowHead, FigText, FigTile } from './parts'

const STACKS = 17
const SW = 10 // 山1列の幅
const WALL_LEN = STACKS * SW
/** 王牌(7列×2段)は対面の山の右端から(例) */
const DEAD = 7

/** 1人分の山(横向き)。dead は王牌として色を変える列 */
function Wall({ x, y, dead = 0 }: { x: number; y: number; dead?: number }) {
  return (
    <g>
      {Array.from({ length: STACKS }, (_, i) => (
        <rect key={i} x={x + i * SW} y={y} width={SW - 1} height={13} rx={1.5} className={i >= STACKS - dead ? 'fig-dead' : 'fig-wall'} />
      ))}
    </g>
  )
}

/** 卓を上から見た図(4人の席・山・王牌・ドラ表示牌・ツモの順番) */
export function FlowTableFigure() {
  const arrow = useArrowId()
  const c = 180
  const wx = c - WALL_LEN / 2 // 山の左端
  const r = 46
  // 反時計回りの円弧(自分 → 下家 → 対面 → 上家)
  const arc = (from: number, to: number) => {
    const p = (deg: number) => [c + r * Math.cos((deg * Math.PI) / 180), c - r * Math.sin((deg * Math.PI) / 180)]
    const [x1, y1] = p(from)
    const [x2, y2] = p(to)
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  const deadX = wx + DEAD * SW
  return (
    <svg viewBox="0 0 360 372" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      <rect x={40} y={40} width={280} height={280} rx={8} className="fig-table" />
      {/* 山:下(自分)・右(下家)・上(対面)・左(上家) */}
      <Wall x={wx} y={268} />
      <g transform={`rotate(-90 ${c} ${c})`}>
        <Wall x={wx} y={268} />
      </g>
      <g transform={`rotate(180 ${c} ${c})`}>
        <Wall x={wx} y={268} dead={DEAD} />
      </g>
      <g transform={`rotate(90 ${c} ${c})`}>
        <Wall x={wx} y={268} />
      </g>
      {/* 王牌とドラ表示牌(対面の山の左端=回転後の右端7列) */}
      <rect x={wx - 3} y={76} width={DEAD * SW + 5} height={19} rx={3} className="fig-outline-accent" />
      <FigTile tile="3p" x={wx + 4 * SW - 3} y={48} w={16} />
      <FigText x={wx + DEAD * SW + 8} y={60} size={12} anchor="start" tone="accent" bold>
        ← ドラ表示牌
      </FigText>
      <FigText x={wx + 34} y={112} size={12} tone="accent" bold>
        王牌(14枚)
      </FigText>
      <FigText x={deadX + ((STACKS - DEAD) * SW) / 2} y={112} size={12} tone="muted">
        山
      </FigText>
      {/* ツモの順番 */}
      <path d={arc(-60, 20)} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <path d={arc(30, 110)} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <path d={arc(120, 200)} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <path d={arc(210, 250)} className="fig-line fig-line--thick fig-line--dash" />
      <FigText x={c} y={c - 4} size={13} bold>
        ツモの順番
      </FigText>
      <FigText x={c} y={c + 14} size={12} tone="muted">
        右隣へ回る
      </FigText>
      {/* 席 */}
      <FigText x={c} y={344} bold>
        自分(親)
      </FigText>
      <FigText x={c} y={364} size={12} tone="muted">
        ここから始める
      </FigText>
      <FigText x={c} y={28} bold>
        対面
      </FigText>
      <FigText x={20} y={185} bold>
        上家
      </FigText>
      <FigText x={340} y={185} bold>
        下家
      </FigText>
    </svg>
  )
}

const KYOKU = ['東1局', '東2局', '東3局', '東4局', '南1局', '南2局', '南3局', '南4局']

/** 半荘の進行図(東1局〜南4局と連荘) */
export function FlowHanchanFigure() {
  const arrow = useArrowId()
  const bw = 64
  const bh = 34
  const gap = 20
  const x0 = 22
  const rows = [70, 178]
  const box = (i: number) => ({ x: x0 + (i % 4) * (bw + gap), y: rows[Math.floor(i / 4)] })
  return (
    <svg viewBox="0 0 360 300" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      {KYOKU.map((k, i) => {
        const { x, y } = box(i)
        return (
          <g key={k}>
            {/* 連荘:同じ局をもう一度 */}
            <path
              d={`M${x + bw - 14} ${y} C${x + bw - 6} ${y - 30}, ${x + 6} ${y - 30}, ${x + 14} ${y}`}
              className="fig-line fig-line--accent"
              markerEnd={arrow.url}
            />
            <rect x={x} y={y} width={bw} height={bh} rx={4} className="fig-box" />
            <FigText x={x + bw / 2} y={y + 22} bold>
              {k}
            </FigText>
            {i % 4 !== 3 && <line x1={x + bw + 2} y1={y + bh / 2} x2={x + bw + gap - 3} y2={y + bh / 2} className="fig-line" markerEnd={arrow.url} />}
          </g>
        )
      })}
      {/* 東4局 → 南1局 */}
      <path
        d={`M${box(3).x + bw / 2} ${rows[0] + bh + 2} V${rows[0] + bh + 26} H${box(4).x + bw / 2} V${rows[1] - 26}`}
        className="fig-line"
        fill="none"
        markerEnd={arrow.url}
      />
      <FigText x={x0} y={18} size={13} tone="accent" anchor="start" bold>
        連荘(同じ局をもう一度)
      </FigText>
      <FigText x={x0} y={36} size={12} tone="muted" anchor="start">
        親のアガリ・流局で親がテンパイのとき
      </FigText>
      {/* 終わり */}
      <line x1={box(7).x + bw / 2} y1={rows[1] + bh + 2} x2={box(7).x + bw / 2} y2={rows[1] + bh + 30} className="fig-line" markerEnd={arrow.url} />
      <FigText x={box(7).x + bw / 2} y={rows[1] + bh + 50} bold>
        終了
      </FigText>
      <FigText x={x0} y={rows[1] + bh + 26} size={12} anchor="start">
        → 次の局へ:子のアガリ・親ノーテンの流局
      </FigText>
      <FigText x={x0} y={rows[1] + bh + 44} size={12} tone="muted" anchor="start">
        (親は右隣へ移る)
      </FigText>
      <FigText x={x0} y={rows[1] + bh + 68} size={12} tone="muted" anchor="start">
        南4局で親が移ったら終了(西入なし)
      </FigText>
    </svg>
  )
}

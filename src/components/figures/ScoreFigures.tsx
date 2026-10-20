// 点数計算の基本:符と翻から基本点、ロン・ツモの支払いまで(30符2翻の例)
import { useArrowId } from './geometry'
import { ArrowHead, FigText } from './parts'

const FU = 30
const HAN = 2
const BASE = FU * 2 ** (HAN + 2)
const up = (n: number) => Math.ceil(n / 100) * 100
const yen = (n: number) => n.toLocaleString('ja-JP')

const PAYS = [
  { who: '子のロン', calc: `${BASE} × 4 = ${yen(BASE * 4)}`, result: `${yen(up(BASE * 4))}点` },
  { who: '親のロン', calc: `${BASE} × 6 = ${yen(BASE * 6)}`, result: `${yen(up(BASE * 6))}点` },
  { who: '子のツモ', calc: `子 ${BASE} × 1・親 ${BASE} × 2`, result: `${yen(up(BASE))}・${yen(up(BASE * 2))}` },
  { who: '親のツモ', calc: `子3人が ${BASE} × 2 ずつ`, result: `${yen(up(BASE * 2))}オール` },
]

/** 符と翻 → 基本点 → 支払い(100点未満は切り上げ) */
export function ScoreFlowFigure() {
  const arrow = useArrowId()
  const rowH = 46
  const top = 132
  return (
    <svg viewBox="0 0 360 336" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      <rect x={90} y={6} width={180} height={34} rx={4} className="fig-box" />
      <FigText x={180} y={28} size={15} bold>
        {FU}符 {HAN}翻
      </FigText>
      <line x1={180} y1={42} x2={180} y2={60} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <FigText x={190} y={56} size={12} tone="muted" anchor="start">
        {`符 × 2の(翻+2)乗 = ${FU} × ${2 ** (HAN + 2)}`}
      </FigText>
      <rect x={90} y={66} width={180} height={38} rx={4} className="fig-box fig-box--accent" />
      <FigText x={180} y={91} size={16} tone="accent" bold>
        基本点 {BASE}
      </FigText>
      <line x1={180} y1={106} x2={180} y2={122} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      {PAYS.map((p, i) => {
        const y = top + i * rowH
        return (
          <g key={p.who}>
            <rect x={6} y={y} width={348} height={rowH - 6} rx={4} className="fig-panel" />
            <FigText x={14} y={y + 25} size={14} anchor="start" bold>
              {p.who}
            </FigText>
            <FigText x={88} y={y + 25} size={12} anchor="start" tone="muted">
              {p.calc}
            </FigText>
            <FigText x={346} y={y + 26} size={15} anchor="end" tone="accent" bold>
              {p.result}
            </FigText>
          </g>
        )
      })}
      <FigText x={180} y={top + 4 * rowH + 12} size={12} tone="muted">
        支払いは1人ずつ、100点未満を切り上げる
      </FigText>
    </svg>
  )
}

// 符計算の積み上げ・押し引きの目安
import { useArrowId } from './geometry'
import { ArrowHead, FigText } from './parts'

const FU = [
  { label: '副底', fu: 20, cls: 'fig-fu-1' },
  { label: '門前ロン', fu: 10, cls: 'fig-fu-2' },
  { label: '暗刻(7筒)', fu: 4, cls: 'fig-fu-3' },
  { label: '雀頭(東)', fu: 2, cls: 'fig-fu-4' },
]

/** 副底20符に符を積み上げて、10符単位に切り上げる(例:36符 → 40符) */
export function FuStackFigure() {
  const arrow = useArrowId()
  const unit = 7 // 1符の幅
  const x0 = 30
  const y = 46
  const h = 40
  const total = FU.reduce((a, f) => a + f.fu, 0)
  const rounded = Math.ceil(total / 10) * 10
  const blocks = FU.map((f, i) => ({ ...f, x: x0 + FU.slice(0, i).reduce((a, g) => a + g.fu, 0) * unit, w: f.fu * unit }))
  return (
    <svg viewBox="0 0 360 292" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      {/* 目盛り(10符ごと) */}
      {[0, 10, 20, 30, 40].map((t) => (
        <g key={t}>
          <line x1={x0 + t * unit} y1={y - 8} x2={x0 + t * unit} y2={y + h + 8} className="fig-grid" />
          <FigText x={x0 + t * unit} y={y - 14} size={12} tone="muted">
            {t}
          </FigText>
        </g>
      ))}
      {/* 切り上げの分 */}
      <rect x={x0 + total * unit} y={y} width={(rounded - total) * unit} height={h} className="fig-roundup" />
      {blocks.map((b) => (
        <rect key={b.label} x={b.x} y={y} width={b.w} height={h} className={b.cls} />
      ))}
      <FigText x={blocks[0].x + blocks[0].w / 2} y={y + 26} size={14} tone="contrast" bold>
        20
      </FigText>
      <FigText x={blocks[1].x + blocks[1].w / 2} y={y + 26} size={14} tone="contrast" bold>
        10
      </FigText>
      {/* 内訳 */}
      {blocks.map((b, i) => (
        <g key={b.label}>
          <rect x={30} y={112 + i * 26} width={16} height={16} className={b.cls} />
          <FigText x={54} y={125 + i * 26} size={14} anchor="start">
            {b.label}
          </FigText>
          <FigText x={200} y={125 + i * 26} size={14} anchor="end" bold>
            +{b.fu}符
          </FigText>
        </g>
      ))}
      <line x1={30} y1={214} x2={200} y2={214} className="fig-grid" />
      <FigText x={54} y={234} size={14} anchor="start">
        合計
      </FigText>
      <FigText x={200} y={234} size={14} anchor="end" bold>
        {total}符
      </FigText>
      <line x1={212} y1={229} x2={250} y2={229} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <FigText x={296} y={236} size={22} tone="accent" bold>
        {rounded}符
      </FigText>
      <rect x={216} y={112} width={16} height={16} className="fig-roundup" />
      <FigText x={240} y={125} size={13} anchor="start">
        切り上げ +{rounded - total}
      </FigText>
      <FigText x={180} y={276} size={12} tone="muted">
        順子・両面待ちは0符。10符単位に切り上げる
      </FigText>
    </svg>
  )
}

/** 押し引きの目安(横:自分の手の良さ、縦:相手の脅威) */
export function PushFoldAxesFigure() {
  const arrow = useArrowId()
  const L = 52
  const R = 344
  const T = 16
  const B = 252
  const dots = [
    { x: 0.82, y: 0.45, label: 'A', text: '良形テンパイ・子リーチ', tone: 'correct' as const },
    { x: 0.18, y: 0.45, label: 'B', text: '愚形1シャンテン・子リーチ', tone: 'accent' as const },
    { x: 0.82, y: 0.8, label: 'C', text: '良形テンパイ・親リーチ', tone: 'text' as const },
  ]
  const px = (v: number) => L + (R - L) * v
  const py = (v: number) => B - (B - T) * v
  return (
    <svg viewBox="0 0 360 368" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      {/* 降り(左上)と押し(右下)。境目の帯は差が小さい */}
      <polygon points={`${L},${T} ${R},${T} ${L},${B}`} className="fig-zone-fold" />
      <polygon points={`${R},${T} ${R},${B} ${L},${B}`} className="fig-zone-push" />
      <line x1={L} y1={B} x2={R} y2={T} className="fig-line fig-line--dash" />
      <FigText x={px(0.24)} y={py(0.8)} size={20} tone="accent" bold>
        降りる
      </FigText>
      <FigText x={px(0.76)} y={py(0.16)} size={20} tone="correct" bold>
        押す
      </FigText>
      <g transform={`rotate(${(-Math.atan2(B - T, R - L) * 180) / Math.PI} ${px(0.5)} ${py(0.5)})`}>
        <FigText x={px(0.5)} y={py(0.5) - 6} size={12} tone="muted">
          境目は差が小さい
        </FigText>
      </g>
      {/* 軸 */}
      <line x1={L} y1={B} x2={R + 4} y2={B} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <line x1={L} y1={B} x2={L} y2={T - 4} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <FigText x={(L + R) / 2} y={B + 20} size={13} bold>
        自分の手の良さ →
      </FigText>
      <FigText x={L} y={B + 38} size={11} tone="muted" anchor="start">
        愚形1シャンテン・安い
      </FigText>
      <FigText x={R} y={B + 38} size={11} tone="muted" anchor="end">
        良形テンパイ・高い
      </FigText>
      <g transform={`rotate(-90 18 ${(T + B) / 2})`}>
        <FigText x={18} y={(T + B) / 2 + 4} size={13} bold>
          相手の脅威 →
        </FigText>
      </g>
      <FigText x={L + 6} y={T + 16} size={11} tone="muted" anchor="start">
        親リーチ・無スジ
      </FigText>
      <FigText x={L + 34} y={B - 8} size={11} tone="muted" anchor="start">
        子リーチ・安全寄り
      </FigText>
      {/* 例 */}
      {dots.map((d) => (
        <g key={d.label}>
          <circle cx={px(d.x)} cy={py(d.y)} r={11} className="fig-dot" />
          <FigText x={px(d.x)} y={py(d.y) + 5} size={13} tone="contrast" bold>
            {d.label}
          </FigText>
        </g>
      ))}
      {dots.map((d, i) => (
        <FigText key={d.label} x={L - 30} y={B + 64 + i * 20} size={13} anchor="start">
          {`${d.label}:${d.text} → ${['押す', '降りる', '境目(安い手なら降り)'][i]}`}
        </FigText>
      ))}
    </svg>
  )
}

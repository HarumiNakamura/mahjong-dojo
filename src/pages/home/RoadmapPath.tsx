import { Link } from '../../app/Link'
import type { RoadmapProgress } from '../../engine/progress'

const STATUS_LABELS = { notStarted: '未着手', inProgress: '練習中', cleared: 'クリア' } as const
/** 1マスの高さ(道の図の座標) */
const ROW = 120

/** 学習ロードマップを、双六のような道のりの図で表す(マスを左右交互に置き、道でつなぐ) */
export function RoadmapPath({ steps }: { steps: readonly RoadmapProgress[] }) {
  const next = steps.findIndex((p) => p.status !== 'cleared')
  const x = (i: number) => (i % 2 === 0 ? 22 : 78)
  const y = (i: number) => i * ROW + ROW / 2
  // マスの中心を、ゆるやかな曲線でつなぐ(横は 0〜100 の割合、縦は px)
  const d = steps
    .map((_, i) => (i === 0 ? `M ${x(0)} ${y(0)}` : `C ${x(i - 1)} ${y(i - 1) + ROW / 2}, ${x(i)} ${y(i) - ROW / 2}, ${x(i)} ${y(i)}`))
    .join(' ')
  return (
    <div className="sugoroku" style={{ height: steps.length * ROW }}>
      <svg className="sugoroku-road" viewBox={`0 0 100 ${steps.length * ROW}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} className="sugoroku-road-line" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className="sugoroku-list">
        {steps.map((p, i) => (
          <li
            key={p.step.id}
            className={`sugoroku-step sugoroku-step--${p.status}${i === next ? ' sugoroku-step--next' : ''} sugoroku-step--${i % 2 === 0 ? 'left' : 'right'}`}
            style={{ top: i * ROW }}
          >
            <Link to={p.step.path} className="sugoroku-link">
              <span className="sugoroku-node" aria-hidden="true">
                {p.status === 'cleared' ? '✓' : i + 1}
              </span>
              <span className="sugoroku-body">
                <span className="sugoroku-title">
                  {p.step.label}
                  <span className="sugoroku-status">{i === next ? 'いまここ' : STATUS_LABELS[p.status]}</span>
                </span>
                <span className="sugoroku-text">{p.step.description}</span>
                <span className="roadmap-bar" role="img" aria-label={`進み具合 ${p.percent}%`}>
                  <span className="roadmap-bar-fill" style={{ width: `${p.percent}%` }} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

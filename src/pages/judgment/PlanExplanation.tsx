import { Link } from '../../app/Link'
import { PLANS, type PlanId } from '../../engine/plan'
import { planLabel, type PlanQuestion } from '../../engine/planQuestion'

/** 方針ごとの点数と根拠。回答後に、その配牌で一人麻雀を続けられる */
export function PlanExplanation({ question: q, answer }: { question: PlanQuestion; answer: PlanId }) {
  const sorted = [...q.scores].sort((a, b) => b.score - a.score)
  return (
    <div className="def-expl">
      <p>
        おすすめの方針: <strong>{q.correct.map(planLabel).join('・')}</strong>
        {q.correct.length > 1 && '(点数の差が小さいので、どれも正解です)'}
      </p>
      <ol className="plan-scores">
        {sorted.map((s) => (
          <li key={s.id} className={`plan-score${q.correct.includes(s.id) ? ' plan-score--correct' : ''}`}>
            <div className="plan-score-head">
              <span className="plan-score-label">
                {s.label}
                {s.id === answer && <span className="def-tag">あなたの回答</span>}
              </span>
              <span className="plan-score-num">{s.score}点</span>
            </div>
            <span className="plan-bar" aria-hidden="true">
              <span className="plan-bar-fill" style={{ width: `${s.score}%` }} />
            </span>
            <ul className="plan-reasons">
              {s.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="def-rule">{PLANS.find((p) => p.id === answer)?.tip}</p>
      <Link to={`/practice/solo?seed=${q.seed}&plan=${answer}`} className="button button--block">
        この配牌で一人麻雀を続ける(方針: {planLabel(answer)})
      </Link>
      <p className="def-hint">点数は、シャンテン数・役牌の対子・ドラ・色の偏り・么九牌・対子の数から計算した目安です。</p>
    </div>
  )
}

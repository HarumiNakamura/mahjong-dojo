import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { PLANS, type PlanId } from '../../engine/plan'
import type { PlanQuestion } from '../../engine/planQuestion'
import { WIND_NAMES } from '../../engine/scoreQuestion'

/** 配牌方針クイズの問題: 配牌13枚+第1ツモを見て、目指す方針を選ぶ */
export function PlanQuestionView({ question: q, answered, answer, onAnswer }: QuestionViewProps<PlanQuestion, PlanId>) {
  return (
    <div className="def-q">
      <div className="eff-meta">
        <span>東場・自風 {WIND_NAMES[q.context.seatWind]}</span>
        <span className="eff-dora">
          ドラ表示牌
          <span className="eff-dora-tile">
            <Tile tile={q.context.doraIndicator} />
          </span>
        </span>
      </div>
      <p className="drill-prompt">配牌と第1ツモです。どの方針で進めますか?</p>
      <Hand tiles={q.hand} drawn={q.drawn} />
      <div className="plan-choices" role="group" aria-label="方針">
        {PLANS.map((p) => {
          let state = ''
          if (answered) {
            if (q.correct.includes(p.id)) state = ' plan-choice--correct'
            else if (answer === p.id) state = ' plan-choice--wrong'
          }
          return (
            <button
              key={p.id}
              type="button"
              className={`plan-choice${state}${answer === p.id ? ' plan-choice--chosen' : ''}`}
              aria-pressed={answer === p.id}
              disabled={answered}
              onClick={() => onAnswer(p.id)}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { Hand } from '../components/tile/Hand'
import type { PlanId } from '../engine/plan'
import { fromPlanData, judgePlan, planKeyOf, planLabel, toPlanData, type PlanQuestion } from '../engine/planQuestion'
import { PlanExplanation } from '../pages/judgment/PlanExplanation'
import { PlanQuestionView } from '../pages/judgment/PlanQuestionView'
import type { DrillDefinition } from './types'

/** 配牌方針クイズ。回答は方針 */
export const planDrill: DrillDefinition<PlanQuestion, PlanId> = {
  id: 'plan',
  title: '配牌方針クイズ',
  path: '/practice/judgment/plan',
  toData: toPlanData,
  fromData: fromPlanData,
  keyOf: planKeyOf,
  judge: judgePlan,
  renderQuestion: (props) => <PlanQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question, answer }) => <PlanExplanation question={question} answer={answer} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <Hand tiles={q.hand} drawn={q.drawn} />
    </div>
  ),
  describeAnswer: (_q, a) => planLabel(a),
  describeCorrect: (q) => q.correct.map(planLabel).join('・'),
}

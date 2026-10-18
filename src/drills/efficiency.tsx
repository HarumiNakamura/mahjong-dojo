import { Hand } from '../components/tile/Hand'
import { isCorrectDiscard } from '../engine/efficiency'
import { DIFFICULTIES, fromQuestionData, questionKeyOf, toQuestionData, type EfficiencyQuestion } from '../engine/efficiencyQuestion'
import { tileName } from '../engine/tiles'
import { EfficiencyExplanation } from '../pages/efficiency/EfficiencyExplanation'
import { EfficiencyQuestionView } from '../pages/efficiency/EfficiencyQuestionView'
import type { DrillDefinition } from './types'

const cutName = (kind: number) => `${tileName({ kind, red: false })}切り`

/** 何切る(牌効率)ドリル。回答は切る牌の種類(0〜33) */
export const efficiencyDrill: DrillDefinition<EfficiencyQuestion, number> = {
  id: 'efficiency',
  title: '何切る(牌効率)',
  path: '/practice/efficiency',
  toData: toQuestionData,
  fromData: fromQuestionData,
  keyOf: questionKeyOf,
  judge: (q, kind) => isCorrectDiscard(q.judgement, kind),
  renderQuestion: (props) => <EfficiencyQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question, answer }) => <EfficiencyExplanation question={question} answer={answer} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">
        {DIFFICULTIES.find((d) => d.id === q.difficulty)?.label}・{q.turn}巡目
      </span>
      <Hand tiles={q.hand} drawn={q.drawn} />
    </div>
  ),
  describeAnswer: (_q, kind) => cutName(kind),
  describeCorrect: (q) => q.judgement.correctKinds.map(cutName).join('・'),
}

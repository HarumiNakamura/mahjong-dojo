import { Hand } from '../components/tile/Hand'
import { tileName } from '../engine/tiles'
import {
  fromSafetyData,
  judgeSafety,
  safestKinds,
  safetyKeyOf,
  SAFETY_LEVELS,
  toSafetyData,
  type SafetyAnswer,
  type SafetyQuestion,
} from '../engine/safetyQuestion'
import { SafetyExplanation } from '../pages/defense/SafetyExplanation'
import { SafetyQuestionView } from '../pages/defense/SafetyQuestionView'
import type { DrillDefinition } from './types'

const name = (kind: number) => tileName({ kind, red: false })

/** 安パイ並べドリル。回答は安全な順に並べた牌の種類(かんたんモードは1つ) */
export const safetyDrill: DrillDefinition<SafetyQuestion, SafetyAnswer> = {
  id: 'safety',
  title: '安パイ並べ',
  path: '/practice/defense',
  toData: toSafetyData,
  fromData: fromSafetyData,
  keyOf: safetyKeyOf,
  judge: judgeSafety,
  renderQuestion: (props) => <SafetyQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question, answer }) => <SafetyExplanation question={question} answer={answer} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">
        {SAFETY_LEVELS.find((l) => l.id === q.level)?.label}・{q.mode === 'pick' ? 'かんたん' : '並べ替え'}
      </span>
      <Hand tiles={q.situation.myHand} drawn={q.situation.drawn} />
    </div>
  ),
  describeAnswer: (q, answer) => (q.mode === 'pick' ? `${name(answer[0])}を選択` : answer.map(name).join(' ')),
  describeCorrect: (q) =>
    q.mode === 'pick'
      ? `${safestKinds(q).map(name).join('・')}`
      : q.assessments.map((a) => name(a.kind)).join(' '),
}

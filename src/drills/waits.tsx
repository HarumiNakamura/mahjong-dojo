import { Hand } from '../components/tile/Hand'
import { tileName } from '../engine/tiles'
import {
  fromWaitsData,
  judgeWaits,
  toWaitsData,
  waitsKeyOf,
  WAITS_LEVELS,
  type WaitsQuestion,
} from '../engine/waitsQuestion'
import { WaitsExplanation } from '../pages/waits/WaitsExplanation'
import { WaitsQuestionView } from '../pages/waits/WaitsQuestionView'
import type { DrillDefinition } from './types'

const names = (kinds: readonly number[]) =>
  kinds.length === 0 ? '待ちなし' : kinds.map((k) => tileName({ kind: k, red: false })).join('・')

/** 待ち当てドリル。回答は待ち牌の種類の一覧 */
export const waitsDrill: DrillDefinition<WaitsQuestion, number[]> = {
  id: 'waits',
  title: '待ち当て',
  path: '/practice/waits',
  toData: toWaitsData,
  fromData: fromWaitsData,
  keyOf: waitsKeyOf,
  judge: judgeWaits,
  renderQuestion: (props) => <WaitsQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question, answer }) => <WaitsExplanation question={question} answer={answer} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">{WAITS_LEVELS.find((l) => l.size === q.level)?.label}</span>
      <Hand tiles={q.hand} />
    </div>
  ),
  describeAnswer: (_q, answer) => names(answer),
  describeCorrect: (q) => names(q.result.waits.map((w) => w.kind)),
}

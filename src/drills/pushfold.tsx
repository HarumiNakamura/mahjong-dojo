import { Hand } from '../components/tile/Hand'
import {
  fromPushFoldData,
  judgePushFold,
  pushFoldKeyOf,
  toPushFoldData,
  type PushFoldAnswer,
  type PushFoldQuestion,
} from '../engine/pushfoldQuestion'
import { PushFoldExplanation } from '../pages/judgment/PushFoldExplanation'
import { PushFoldQuestionView } from '../pages/judgment/PushFoldQuestionView'
import type { DrillDefinition } from './types'

const LABELS = { push: '押す', fold: '降りる' } as const

/** 押し引きジャッジ。回答は押す/降りる */
export const pushFoldDrill: DrillDefinition<PushFoldQuestion, PushFoldAnswer> = {
  id: 'pushfold',
  title: '押し引きジャッジ',
  path: '/practice/judgment/pushfold',
  toData: toPushFoldData,
  fromData: fromPushFoldData,
  keyOf: pushFoldKeyOf,
  judge: judgePushFold,
  renderQuestion: (props) => <PushFoldQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question }) => <PushFoldExplanation question={question} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">{q.handLabel}</span>
      <Hand tiles={q.situation.myHand} drawn={q.situation.drawn} />
    </div>
  ),
  describeAnswer: (_q, a) => LABELS[a],
  describeCorrect: (q) => (q.result.verdict === 'either' ? '押す・降りるのどちらも正解' : LABELS[q.result.verdict]),
}

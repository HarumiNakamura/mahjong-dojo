import { Hand } from '../components/tile/Hand'
import { callLabel, type CallAnswer } from '../engine/call'
import { callKeyOf, fromCallData, judgeCallQuestion, toCallData, type CallQuestion } from '../engine/callQuestion'
import { tileName } from '../engine/tiles'
import { CallExplanation } from '../pages/judgment/CallExplanation'
import { CallQuestionView } from '../pages/judgment/CallQuestionView'
import type { DrillDefinition } from './types'

const name = (k: number) => tileName({ kind: k, red: false })

/** 鳴き判断クイズ。回答はスルー、または鳴き方と打牌 */
export const callDrill: DrillDefinition<CallQuestion, CallAnswer> = {
  id: 'call',
  title: '鳴き判断クイズ',
  path: '/practice/judgment/call',
  toData: toCallData,
  fromData: fromCallData,
  keyOf: callKeyOf,
  judge: judgeCallQuestion,
  renderQuestion: (props) => <CallQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question, answer }) => <CallExplanation question={question} answer={answer} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">{name(q.situation.tile.kind)}が出たとき</span>
      <Hand tiles={q.situation.hand} />
    </div>
  ),
  describeAnswer: (_q, a) => (a.type === 'skip' ? 'スルー' : `${callLabel(a.type, a.using)}・${name(a.discard)}切り`),
  describeCorrect: (q) => {
    const a = q.analysis
    const calls = a.goodOptions.map((o) => `${callLabel(o.type, o.using)}・${name(o.best.kind)}切り`).join(' / ')
    return a.verdict === 'skip' ? 'スルー' : a.verdict === 'call' ? calls : `スルー または ${calls}`
  },
}

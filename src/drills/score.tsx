import { Hand } from '../components/tile/Hand'
import { formatTsumo } from '../engine/scoreTable'
import {
  fromScoreData,
  judgeScore,
  scoreKeyOf,
  SCORE_LEVELS,
  type ScoreAnswer,
  type ScoreQuestion,
} from '../engine/scoreQuestion'
import { ScoreExplanation } from '../pages/score/ScoreExplanation'
import { ScoreQuestionView } from '../pages/score/ScoreQuestionView'
import type { DrillDefinition } from './types'

const f = (n: number) => n.toLocaleString('ja-JP')

function describe(_q: ScoreQuestion, a: ScoreAnswer): string {
  if ('yaku' in a) return a.yaku.length ? a.yaku.join('・') : '(選択なし)'
  if ('han' in a) return `${a.han}翻${a.fu}符`
  return a.points.map(f).join('/')
}

/** 点数計算ドリル */
export const scoreDrill: DrillDefinition<ScoreQuestion, ScoreAnswer> = {
  id: 'score',
  title: '点数計算',
  path: '/practice/score',
  toData: (q) => q.data,
  fromData: fromScoreData,
  keyOf: (q) => `${q.data.level}|${scoreKeyOf(q)}`,
  judge: judgeScore,
  renderQuestion: (props) => <ScoreQuestionView key={props.index} {...props} />,
  renderExplanation: ({ question, answer, correct }) => <ScoreExplanation question={question} answer={answer} correct={correct} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">
        {SCORE_LEVELS.find((l) => l.id === q.data.level)?.label}・{q.context.seatWind === 1 ? '親' : '子'}・{q.context.tsumo ? 'ツモ' : 'ロン'}
      </span>
      <Hand tiles={q.hand} />
    </div>
  ),
  describeAnswer: describe,
  describeCorrect: (q) => {
    const r = q.result
    if (q.data.level === 'beginner') return r.yaku.map((y) => y.name).join('・')
    if (q.data.level === 'intermediate') return `${r.han}翻${r.fu}符`
    const p = r.payment
    return p.type === 'ron' ? `${f(p.fromDiscarder)}点` : formatTsumo(p)
  },
}

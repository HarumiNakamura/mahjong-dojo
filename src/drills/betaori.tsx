import {
  betaoriKeyOf,
  fromBetaoriData,
  judgeBetaori,
  toBetaoriData,
  type BetaoriQuestion,
} from '../engine/betaoriQuestion'
import { replayBetaori, summarizeBetaori } from '../engine/betaori'
import { Hand } from '../components/tile/Hand'
import { BetaoriGameView } from '../pages/defense/BetaoriGameView'
import { BetaoriReview } from '../pages/defense/BetaoriReview'
import type { DrillDefinition } from './types'

/** ベタオリサバイバル。回答は切った牌の種類の並び。放銃せずに終われたら正解 */
export const betaoriDrill: DrillDefinition<BetaoriQuestion, number[]> = {
  id: 'betaori',
  title: 'ベタオリサバイバル',
  path: '/practice/defense',
  toData: toBetaoriData,
  fromData: fromBetaoriData,
  keyOf: betaoriKeyOf,
  judge: judgeBetaori,
  renderQuestion: (props) => <BetaoriGameView key={props.index} {...props} />,
  renderExplanation: ({ question, answer }) => <BetaoriReview question={question} answer={answer} />,
  renderPreview: (q) => (
    <div className="drill-preview">
      <span className="drill-preview-meta">{q.game.situation.turn}巡目から</span>
      <Hand tiles={q.game.situation.myHand} drawn={q.game.situation.drawn} />
    </div>
  ),
  describeAnswer: (q, answer) => {
    const g = replayBetaori(q.seed, answer)
    if (!g) return '記録なし'
    const s = summarizeBetaori(g)
    return `${s.turns}巡${s.dealtIn ? 'で放銃' : '逃げ切り'}(最善 ${s.safestCount}巡)`
  },
  describeCorrect: () => '放銃せずに流局まで逃げ切る',
}

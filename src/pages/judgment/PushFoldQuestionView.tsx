import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import type { PushFoldAnswer, PushFoldQuestion } from '../../engine/pushfoldQuestion'
import { DefenseRivers } from '../defense/DefenseRivers'
import { DefenseMeta } from '../defense/SafetyQuestionView'

/** 押し引きジャッジの問題: 押す(危険牌を切る)か降りるかを選ぶ */
export function PushFoldQuestionView({ question: q, answered, answer, onAnswer }: QuestionViewProps<PushFoldQuestion, PushFoldAnswer>) {
  const s = q.situation
  const tiles = [...s.myHand, s.drawn]
  const discardIndex = tiles.findIndex((t) => t.kind === q.discard)
  const label = q.safety.perPlayer[0]?.label
  return (
    <div className="def-q">
      <DefenseMeta question={{ level: '', situation: s }} />
      <DefenseRivers situation={s} />
      <div className="pf-me">
        <p className="pf-me-line">
          <span className="pf-key">自分の手</span>
          {q.handLabel}
        </p>
        <p className="pf-me-line">
          <span className="pf-key">打点</span>
          {q.valueLabel}
        </p>
        {s.dealerSeat === 0 && <p className="pf-me-line">自分は親です</p>}
      </div>
      <Hand tiles={s.myHand} drawn={s.drawn} selected={discardIndex} />
      <p className="pf-danger">
        形を保つには
        <span className="pf-danger-tile">
          <Tile tile={tiles[discardIndex]} />
        </span>
        を切るしかありません({label}・放銃率の目安 約{q.safety.danger}%)
      </p>
      <p className="drill-prompt">押しますか?降りますか?</p>
      <div className="pf-choices">
        {(['push', 'fold'] as const).map((a) => (
          <button
            key={a}
            type="button"
            className={`button button--block${answer === a ? ' button--primary' : ''}`}
            disabled={answered}
            aria-pressed={answer === a}
            onClick={() => onAnswer(a)}
          >
            {a === 'push' ? '押す(危険牌を切る)' : '降りる(安全な牌を切る)'}
          </button>
        ))}
      </div>
    </div>
  )
}

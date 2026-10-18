import { useState } from 'react'
import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { BETAORI_END_LABELS, discardBetaori, type BetaoriGame } from '../../engine/betaori'
import type { BetaoriQuestion } from '../../engine/betaoriQuestion'
import { tileName } from '../../engine/tiles'
import { DefenseRivers } from './DefenseRivers'
import { DefenseMeta } from './SafetyQuestionView'

const name = (kind: number) => tileName({ kind, red: false })

/** ベタオリサバイバルの対局画面。終わったら打牌の並びを回答として渡す */
export function BetaoriGameView({ question, answered, onAnswer }: QuestionViewProps<BetaoriQuestion, number[]>) {
  const [game, setGame] = useState<BetaoriGame>(question.game)
  const [selected, setSelected] = useState<number | null>(null)
  const s = game.situation
  const tiles = [...s.myHand, s.drawn]
  const last = game.turns.at(-1)

  const discard = () => {
    if (selected === null || game.end) return
    const next = discardBetaori(game, tiles[selected].kind)
    setGame(next)
    setSelected(null)
    if (next.end) onAnswer(next.turns.map((t) => t.discard.kind))
  }

  return (
    <div className="def-q">
      <DefenseMeta question={{ level: '', situation: s }} />
      <p className="def-wall">
        残りの山 {s.wall.length}枚・切った回数 {game.turns.length}回
      </p>
      <DefenseRivers situation={s} />

      {last && (
        <p className={`def-last${last.danger > last.minDanger ? ' def-last--warn' : ''}`} aria-live="polite">
          前の巡: {name(last.discard.kind)}(
          {last.assessments.find((a) => a.kind === last.discard.kind)?.perPlayer[0].label}・約{last.danger}%)
          {last.danger > last.minDanger
            ? ` → もっと安全な牌: ${last.safestKinds.map(name).join('・')}(約${last.minDanger}%)`
            : ' → 一番安全な牌でした'}
        </p>
      )}

      {game.end ? (
        <p className={`def-end def-end--${game.end.reason}`}>
          {BETAORI_END_LABELS[game.end.reason]}
          {game.end.reason === 'dealIn' ? '!リーチに当たってしまいました。' : '。放銃せずに終われました。'}
        </p>
      ) : (
        !answered && (
          <>
            <p className="drill-prompt">安全だと思う牌を切ってください</p>
            <Hand tiles={s.myHand} drawn={s.drawn} selected={selected} onSelect={(i) => setSelected(i === selected ? null : i)} />
            <button type="button" className="button button--primary button--block" disabled={selected === null} onClick={discard}>
              {selected === null ? '牌をタップして選んでください' : `${tileName(tiles[selected])}を切る`}
            </button>
          </>
        )
      )}
    </div>
  )
}

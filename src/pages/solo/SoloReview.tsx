import { useState } from 'react'
import { Discards } from '../../components/tile/Discards'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { efficiencyDrill } from '../../drills/efficiency'
import { useDrillRecorder } from '../../drills/useDrillRecorder'
import { summarizeSolo, turnToQuestion, type SoloGame, type SoloTurnReview } from '../../engine/solo'
import { tileName } from '../../engine/tiles'
import { EfficiencyExplanation } from '../efficiency/EfficiencyExplanation'

/** 最善手との差の表示(シャンテン数を戻した打牌は枚数ではなく「シャンテン戻し」と出す) */
function diffLabel(r: SoloTurnReview): string {
  if (r.correct) return '一致'
  if (r.chosenShanten !== null && r.log.judgement && r.chosenShanten > r.log.judgement.best.shanten) return 'シャンテン戻し'
  return `−${r.diff}枚`
}

const names = (kinds: number[]) => kinds.map((k) => tileName({ kind: k, red: false })).join('・')

export function SoloReview({ game }: { game: SoloGame }) {
  const summary = summarizeSolo(game)
  const [open, setOpen] = useState<number | null>(null)
  const bigMisses = summary.turns.filter((t) => t.bigMiss).length

  return (
    <div className="solo-review">
      <p className="solo-disclaimer">この採点は牌効率だけで、役や打点は考えていません。</p>

      <div className="solo-result">
        <p className="solo-result-main">
          {summary.agari
            ? `${game.end!.turn}巡目にツモアガリ!`
            : `流局(${summary.tenpaiAtEnd ? 'テンパイ' : 'ノーテン'})`}
        </p>
        <dl className="rec-stats">
          <div>
            <dt>初めてテンパイ</dt>
            <dd>{summary.firstTenpaiTurn === null ? 'なし' : `${summary.firstTenpaiTurn}巡目`}</dd>
          </div>
          <div>
            <dt>最善手と一致</dt>
            <dd>
              {summary.matched}/{summary.scored}
            </dd>
          </div>
          <div>
            <dt>受け入れの差(合計)</dt>
            <dd>{summary.totalDiff}枚</dd>
          </div>
        </dl>
        {summary.tenpaiTurns.length > 0 && <p className="solo-note">テンパイしていた巡目:{summary.tenpaiTurns.join('・')}巡目</p>}
        <div className="solo-final">
          <p className="solo-label">最後の手牌と河</p>
          <Hand tiles={game.hand} drawn={game.end?.reason === 'agari' ? game.drawn : null} />
          <Discards tiles={game.discards} riichiIndex={game.riichiIndex} />
        </div>
      </div>

      <h2 className="eff-heading">巡目ごとの打牌</h2>
      <p className="solo-note">
        {bigMisses > 0
          ? `受け入れの差が大きかった巡(${bigMisses}回)に「要チェック」が付いています。タップすると解説が見られます。`
          : '受け入れの差が大きかった巡はありません。各巡をタップすると解説が見られます。'}
      </p>
      <ol className="solo-turns">
        {summary.turns.map((t) => (
          <TurnRow key={t.log.turn} review={t} open={open === t.log.turn} onToggle={() => setOpen(open === t.log.turn ? null : t.log.turn)} />
        ))}
      </ol>
    </div>
  )
}

function TurnRow({ review, open, onToggle }: { review: SoloTurnReview; open: boolean; onToggle: () => void }) {
  const { log } = review
  const { favorite } = useDrillRecorder(efficiencyDrill)
  const question = turnToQuestion(log)
  const flags = (
    <>
      {log.riichi && <span className="solo-tag">リーチ</span>}
      {log.tenpai && <span className="solo-tag">テンパイ</span>}
    </>
  )

  if (review.correct === null || !question) {
    return (
      <li className="solo-turn-row solo-turn-row--muted">
        <div className="solo-turn-head">
          <span className="solo-turn-no">{log.turn}巡目</span>
          <span className="solo-turn-tile">
            <Tile tile={log.discard} />
            {tileName(log.discard)}
          </span>
          <span className="solo-turn-diff">リーチ後のツモ切り(採点なし)</span>
          {flags}
        </div>
      </li>
    )
  }

  const fav = favorite.isFavorite(question)
  return (
    <li className={`solo-turn-row${review.bigMiss ? ' solo-turn-row--miss' : ''}${review.correct ? ' solo-turn-row--good' : ''}`}>
      <button type="button" className="solo-turn-head solo-turn-button" aria-expanded={open} onClick={onToggle}>
        <span className="solo-turn-no">{log.turn}巡目</span>
        <span className="solo-turn-tile">
          <Tile tile={log.discard} />
          {tileName(log.discard)}
        </span>
        <span className="solo-turn-best">最善:{names(log.judgement!.correctKinds)}</span>
        <span className="solo-turn-diff">{diffLabel(review)}</span>
        {review.bigMiss && <span className="solo-tag solo-tag--miss">要チェック</span>}
        {flags}
      </button>
      {open && (
        <div className="solo-turn-detail">
          <Hand tiles={log.hand} drawn={log.drawn} selected={[...log.hand, log.drawn].findIndex((t) => t.kind === log.discard.kind)} />
          <EfficiencyExplanation question={question} answer={log.discard.kind} />
          <button type="button" className="drill-favorite solo-fav" aria-pressed={fav} onClick={() => favorite.toggle(question)}>
            <span aria-hidden="true">{fav ? '★' : '☆'}</span>
            {fav ? '復習リストに追加済み' : '復習リストに追加'}
          </button>
        </div>
      )}
    </li>
  )
}

import { useMemo, useState } from 'react'
import { Discards } from '../../components/tile/Discards'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { shantenLabel } from '../../engine/efficiencyExplain'
import {
  canTsumo,
  currentJudgement,
  declareTsumo,
  discardTile,
  reviewTurn,
  riichiDiscardKinds,
  SOLO_TURNS,
  type SoloGame,
} from '../../engine/solo'
import { tileName } from '../../engine/tiles'

interface Props {
  game: SoloGame
  onChange: (game: SoloGame) => void
  /** 練習モード: 打牌ごとに受け入れ枚数を表示する */
  practice: boolean
}

export function SoloPlay({ game, onChange, practice }: Props) {
  const [riichiMode, setRiichiMode] = useState(false)
  const tiles = game.drawn ? [...game.hand, game.drawn] : game.hand
  const drawnIndex = game.hand.length
  const inRiichi = game.riichiIndex !== null
  const riichiKinds = useMemo(() => riichiDiscardKinds(game), [game])
  const tsumoable = useMemo(() => canTsumo(game), [game])
  // 練習モードのときだけ受け入れを計算して見せる(普段は答えを出さない)
  const judgement = useMemo(() => (practice && !inRiichi && game.drawn ? currentJudgement(game) : null), [practice, inRiichi, game])

  const captions = judgement
    ? tiles.map((t) => {
        const o = judgement.analysis.options.find((x) => x.tile.kind === t.kind)!
        return `${o.total}枚${o.shanten > judgement.bestForward.shanten ? '戻' : ''}`
      })
    : undefined

  const isDisabled = (i: number) => {
    if (inRiichi) return i !== drawnIndex
    if (riichiMode) return !riichiKinds.includes(tiles[i].kind)
    return false
  }

  const discard = (i: number) => {
    if (isDisabled(i)) return
    onChange(discardTile(game, i, { riichi: riichiMode }))
    setRiichiMode(false)
  }

  const last = game.logs[game.logs.length - 1]
  const lastReview = practice && last ? reviewTurn(last) : null

  return (
    <div className="solo">
      <div className="solo-status">
        <span className="solo-turn">
          {game.turn}巡目 <small>/ {SOLO_TURNS}</small>
        </span>
        <span>残りツモ {game.wall.length}回</span>
        <span className="solo-dora">
          ドラ表示牌
          <span className="solo-dora-tile">
            <Tile tile={game.doraIndicator} />
          </span>
        </span>
        {inRiichi && <span className="badge solo-riichi">リーチ中</span>}
      </div>

      <div className="solo-river">
        <p className="solo-label">自分の河</p>
        {game.discards.length > 0 ? <Discards tiles={game.discards} riichiIndex={game.riichiIndex} /> : <p className="solo-none">まだありません</p>}
      </div>

      <p className="drill-prompt solo-prompt">
        {riichiMode ? 'リーチ:切る牌を選んでください(テンパイになる牌だけ選べます)' : inRiichi ? 'リーチ中はツモ切りです' : '切る牌をタップして選び、もう一度タップ(または下のボタン)で決定します'}
      </p>
      <Hand tiles={game.hand} drawn={game.drawn} onPick={discard} pickLabel={riichiMode ? 'を切ってリーチ' : 'を切る'} captions={captions} isDisabled={isDisabled} />

      {practice && (
        <p className="solo-practice-note">
          {judgement
            ? '牌の下の数字は、その牌を切ったときの受け入れ枚数です(「戻」はシャンテン数が戻る打牌)。'
            : '練習モード:リーチ中は受け入れを表示しません。'}
        </p>
      )}
      {lastReview && lastReview.correct !== null && (
        <p className={`solo-last ${lastReview.correct ? 'solo-last--good' : 'solo-last--bad'}`}>
          前の巡({lastReview.log.turn}巡目)の{tileName(lastReview.log.discard)}切り:{shantenLabel(lastReview.chosenShanten!)}・受け入れ
          {lastReview.chosenTotal}枚
          {lastReview.correct
            ? '(最善手)'
            : ` / 最善の${lastReview.log.judgement!.correctKinds.map((k) => tileName({ kind: k, red: false })).join('・')}切りは${shantenLabel(lastReview.log.judgement!.best.shanten)}・${lastReview.bestTotal}枚`}
        </p>
      )}

      <div className="solo-actions">
        {tsumoable && (
          <button type="button" className="button button--primary" onClick={() => onChange(declareTsumo(game))}>
            ツモ(アガリ)
          </button>
        )}
        {!inRiichi && riichiKinds.length > 0 && !riichiMode && (
          <button type="button" className="button" onClick={() => setRiichiMode(true)}>
            リーチ
          </button>
        )}
        {riichiMode && (
          <button type="button" className="button" onClick={() => setRiichiMode(false)}>
            リーチをやめる
          </button>
        )}
        {inRiichi && (
          <button type="button" className="button" onClick={() => discard(drawnIndex)}>
            ツモ切り
          </button>
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { BETAORI_END_LABELS, replayBetaori, summarizeBetaori } from '../../engine/betaori'
import type { BetaoriQuestion } from '../../engine/betaoriQuestion'
import { SEAT_NAMES } from '../../engine/danger'
import { tileName } from '../../engine/tiles'
import { dangerLevel } from './defenseUi'
import { RiichiReveal } from './SafetyExplanation'

const name = (kind: number) => tileName({ kind, red: false })

/** ベタオリサバイバルの振り返り: 毎巡の打牌と一番安全な牌、安パイの残り方 */
export function BetaoriReview({ question, answer }: { question: BetaoriQuestion; answer: number[] }) {
  const game = useMemo(() => replayBetaori(question.seed, answer), [question.seed, answer])
  const [open, setOpen] = useState<number | null>(null)
  if (!game || !game.end) return <p>記録を再現できませんでした。</p>
  const sum = summarizeBetaori(game)
  const maxStock = Math.max(1, ...game.turns.map((t) => t.safeStock))
  const end = game.end
  const ronTile = end.reason === 'dealIn' ? game.turns.at(-1)!.discard : null

  return (
    <div className="def-expl">
      <p>
        結果: <strong>{BETAORI_END_LABELS[end.reason]}</strong>
        {end.reason === 'dealIn' && `(${SEAT_NAMES[end.seat]}に${name(ronTile!.kind)}で放銃)`}
        {end.reason === 'otherWin' && `(${SEAT_NAMES[end.winner]}が${name(end.tile.kind)}で${end.tsumo ? 'ツモ' : 'ロン'})`}
      </p>
      <p>
        {sum.turns}巡のうち、一番安全な牌を選べたのは <strong>{sum.safestCount}巡</strong>。 放銃する確率の目安は合計 約{sum.risk}%
        (毎巡一番安全な牌なら 約{sum.bestRisk}%)。
      </p>

      <h3 className="def-subheading">安パイ(現物)の残り方</h3>
      <div className="def-stock" role="img" aria-label={`巡ごとの現物の枚数: ${game.turns.map((t) => t.safeStock).join('、')}`}>
        {game.turns.map((t) => (
          <div key={t.turn} className="def-stock-col">
            <span className="def-stock-num">{t.safeStock}</span>
            <span
              className={`def-stock-bar${t.safeStock === 0 ? ' def-stock-bar--empty' : ''}`}
              style={{ height: `${(t.safeStock / maxStock) * 64 + 2}px` }}
            />
            <span className="def-stock-turn">{t.turn}</span>
          </div>
        ))}
      </div>
      <p className="def-hint">棒は、その巡に手牌にあった現物の枚数(下の数字は巡目)。</p>
      <p className="def-rule">{sum.stockComment}</p>

      <h3 className="def-subheading">1巡ずつの振り返り</h3>
      <p className="def-hint">行をタップすると、その巡の手牌の危険度が見られます。</p>
      <ol className="def-rows">
        {game.turns.map((t, i) => {
          const best = t.danger <= t.minDanger
          const label = t.assessments.find((a) => a.kind === t.discard.kind)?.perPlayer[0].label
          return (
            <li key={i}>
              <button type="button" className={`def-row${open === i ? ' def-row--focus' : ''}`} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span className="def-row-rank">{t.turn}</span>
                <span className="def-row-tile">
                  <Tile tile={t.discard} />
                </span>
                <span className="def-row-label">
                  {label}
                  {!best && `(最善: ${t.safestKinds.map(name).join('・')} 約${t.minDanger}%)`}
                  {t.dealtIn && '・放銃'}
                </span>
                <span className={`def-danger def-danger--${dangerLevel(t.danger)}`}>{t.danger}%</span>
                <span className={`def-row-mark${best ? ' def-row-mark--ok' : ''}`}>{best ? '○' : '×'}</span>
              </button>
              {open === i && (
                <div className="def-turn-detail">
                  <Hand
                    tiles={t.tiles.slice(0, 13)}
                    drawn={t.tiles[13]}
                    captions={t.tiles.map((x) => `${t.assessments.find((a) => a.kind === x.kind)?.danger}`)}
                  />
                  <p className="def-hint">牌の下の数字は危険度(%)。</p>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <RiichiReveal situation={game.situation} />
    </div>
  )
}

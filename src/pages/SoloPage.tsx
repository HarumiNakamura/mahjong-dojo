import { useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { readQuery } from '../app/router'
import { usePersistentSetting } from '../app/usePersistentSetting'
import { PLANS } from '../engine/plan'
import { isPlanId } from '../engine/planQuestion'
import { createRng } from '../engine/random'
import { SOLO_TURNS, startSoloGame, type SoloGame } from '../engine/solo'
import { SoloPlay } from './solo/SoloPlay'
import { SoloReview } from './solo/SoloReview'
import './efficiency/efficiency.css'
import './records/records.css'
import './judgment/judgment.css'
import './defense/defense.css'
import './solo/solo.css'
import './pages.css'

const newGame = () => startSoloGame(createRng(Math.floor(Math.random() * 2 ** 31)))

/** URL の ?seed=…&plan=… (配牌方針クイズから続けるとき)を読む */
function fromQuery(): { game: SoloGame; plan: (typeof PLANS)[number] | null } {
  const q = readQuery()
  const seed = Number(q.get('seed'))
  const planId = q.get('plan')
  if (q.has('seed') && Number.isInteger(seed) && seed >= 0) {
    return { game: startSoloGame(createRng(seed)), plan: isPlanId(planId) ? PLANS.find((p) => p.id === planId)! : null }
  }
  return { game: newGame(), plan: null }
}

export function SoloPage() {
  const [initial] = useState(fromQuery)
  const [game, setGame] = useState<SoloGame>(initial.game)
  const [plan, setPlan] = useState(initial.plan)
  const restart = () => {
    setGame(newGame())
    setPlan(null)
  }
  const [practice, setPractice] = usePersistentSetting<boolean>('mahjong-dojo:solo-practice', false)

  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">一人麻雀</h1>
        <button type="button" className="button eff-change" onClick={restart}>
          新しい局
        </button>
      </div>
      <p className="page-lead">
        配牌から1人でツモって切るを繰り返します(鳴きなし)。{SOLO_TURNS}巡かアガリで終わり、最後に牌効率で振り返ります。
      </p>
      {plan && (
        <div className="solo-plan">
          <p>
            <strong>方針: {plan.label}</strong>(配牌方針クイズの続き)
          </p>
          <p>{plan.tip}</p>
          <p className="def-hint">一人麻雀は鳴きなしなので、タンヤオ・役牌も門前で目指します。振り返りの採点は牌効率だけです。</p>
        </div>
      )}
      <label className="solo-setting">
        <input type="checkbox" checked={practice} onChange={(e) => setPractice(e.target.checked)} />
        <span>
          練習モード
          <small>打牌ごとに受け入れ枚数を表示する</small>
        </span>
      </label>

      {game.end === null ? (
        <SoloPlay game={game} onChange={setGame} practice={practice} />
      ) : (
        <>
          <SoloReview key={game.logs.length + game.doraIndicator.kind} game={game} />
          <div className="link-row">
            <button type="button" className="button button--primary" onClick={restart}>
              もう1局
            </button>
            <Link to="/records" className="button">
              学習記録(復習リスト)へ
            </Link>
          </div>
        </>
      )}
      <StorageNotice compact />
    </>
  )
}

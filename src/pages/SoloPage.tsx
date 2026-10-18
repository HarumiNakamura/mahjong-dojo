import { useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { usePersistentSetting } from '../app/usePersistentSetting'
import { createRng } from '../engine/random'
import { SOLO_TURNS, startSoloGame, type SoloGame } from '../engine/solo'
import { SoloPlay } from './solo/SoloPlay'
import { SoloReview } from './solo/SoloReview'
import './efficiency/efficiency.css'
import './records/records.css'
import './solo/solo.css'
import './pages.css'

const newGame = () => startSoloGame(createRng(Math.floor(Math.random() * 2 ** 31)))

export function SoloPage() {
  const [game, setGame] = useState<SoloGame>(newGame)
  const [practice, setPractice] = usePersistentSetting<boolean>('mahjong-dojo:solo-practice', false)

  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">一人麻雀</h1>
        <button type="button" className="button eff-change" onClick={() => setGame(newGame())}>
          新しい局
        </button>
      </div>
      <p className="page-lead">
        配牌から1人でツモって切るを繰り返します(鳴きなし)。{SOLO_TURNS}巡かアガリで終わり、最後に牌効率で振り返ります。
      </p>
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
            <button type="button" className="button button--primary" onClick={() => setGame(newGame())}>
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

import { useEffect, useState } from 'react'
import { usePersistentSetting } from '../app/usePersistentSetting'
import { startSession, type GameSession, type GameSpeed } from '../game/session'
import { PlayResult } from './play/PlayResult'
import { PlayTable } from './play/PlayTable'
import './play/play.css'
import './pages.css'

const SPEEDS: { value: GameSpeed; label: string }[] = [
  { value: 1, label: '速い' },
  { value: 3, label: 'ふつう' },
  { value: 5, label: 'ゆっくり' },
]

/** CPU対戦(作成中。メニューやサイトマップにはまだ載せていない) */
export function PlayPage() {
  const [speed, setSpeed] = usePersistentSetting<number>('mahjong-dojo:play-speed', 3)
  const [session, setSession] = useState<GameSession | null>(null)

  // ページを離れたら対局を止める
  useEffect(() => () => session?.game.stop(), [session])

  const start = () => setSession(startSession(speed as GameSpeed))

  return (
    <>
      <div className="play-header">
        <h1 className="page-title">CPU対戦</h1>
        <label className="play-speed">
          CPUの速さ
          <select
            value={speed}
            onChange={(e) => {
              const v = Number(e.target.value) as GameSpeed
              setSpeed(v)
              session?.setSpeed(v)
            }}
          >
            {SPEEDS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {session ? (
        <>
          <PlayTable key={String(session.game.model.title) + session.game.model.qijia} session={session} />
          <PlayResult session={session} onRestart={start} />
        </>
      ) : (
        <div className="play-start">
          <p>あなたと CPU 3人で、東南戦(半荘)を打ちます。ルールは Mリーグ公式ルールです。</p>
          <ul>
            <li>切る牌は、タップで選んでもう一度タップで決定します。</li>
            <li>チー・ポン・カン・リーチ・ツモ・ロンは、画面の下のボタンで選びます。</li>
            <li>喰い替えになる牌・フリテンのロン・役のないアガリは選べません。</li>
          </ul>
          <button type="button" className="button button--primary button--block" onClick={start}>
            対局を始める
          </button>
        </div>
      )}
    </>
  )
}

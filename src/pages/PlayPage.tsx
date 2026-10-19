import { useEffect, useState } from 'react'
import { clearGameSave, loadGameSave, storeGameSave } from '../app/playSave'
import { useRecords } from '../app/records/useRecords'
import { usePersistentSetting } from '../app/usePersistentSetting'
import { addGame } from '../engine/records'
import { gameRecordOf } from '../game/gameRecord'
import { describeSave } from '../game/save'
import type { GameSave } from '../game/selfplay'
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
  const [saved, setSaved] = useState<GameSave | null>(() => loadGameSave())
  const { update } = useRecords()

  // ページを離れたら対局を止める(途中保存は残る)
  useEffect(() => () => session?.game.stop(), [session])

  const start = (resume: GameSave | null) => {
    session?.game.stop()
    if (!resume) clearGameSave()
    setSaved(null)
    setSession(
      startSession({
        speed: speed as GameSpeed,
        resume,
        // 局が始まるたびに保存する(ページを閉じても、その局の最初から続けられる)
        onKyokuStart: storeGameSave,
        onGameEnd: (paipu, final) => {
          clearGameSave()
          const now = new Date()
          update((d) => addGame(d, gameRecordOf(paipu, final, 'latest', now, `game-${now.getTime()}`)))
        },
      }),
    )
  }

  const quit = () => {
    if (!window.confirm('対局をやめますか?\nこの局の最初から「続きから」で再開できます。')) return
    session?.game.stop()
    setSession(null)
    setSaved(loadGameSave())
  }

  const restart = () => {
    if (!window.confirm('最初からやり直しますか?\nいまの対局の途中経過は消えます。')) return
    start(null)
  }

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
          <PlayResult session={session} onRestart={() => start(null)} />
          <div className="play-controls">
            <button type="button" className="button" onClick={quit}>
              対局をやめる
            </button>
            <button type="button" className="button" onClick={restart}>
              最初からやり直す
            </button>
          </div>
        </>
      ) : (
        <div className="play-start">
          <p>あなたと CPU 3人で、東南戦(半荘)を打ちます。ルールは Mリーグ公式ルールです。</p>
          <ul>
            <li>切る牌は、タップで選んでもう一度タップで決定します。</li>
            <li>チー・ポン・カン・リーチ・ツモ・ロンは、画面の下のボタンで選びます。</li>
            <li>喰い替えになる牌・フリテンのロン・役のないアガリは選べません。</li>
            <li>局が始まるたびに、このブラウザに途中経過を保存します。ページを閉じても続きから打てます。</li>
          </ul>
          {saved ? (
            <>
              <button type="button" className="button button--primary button--block" onClick={() => start(saved)}>
                続きから({describeSave(saved)})
              </button>
              <button
                type="button"
                className="button button--block"
                onClick={() => {
                  if (window.confirm('途中の対局を消して、最初から始めますか?')) start(null)
                }}
              >
                最初から始める
              </button>
            </>
          ) : (
            <button type="button" className="button button--primary button--block" onClick={() => start(null)}>
              対局を始める
            </button>
          )}
        </div>
      )}
    </>
  )
}

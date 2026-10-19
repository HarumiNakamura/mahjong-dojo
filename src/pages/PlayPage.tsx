import { useEffect, useState } from 'react'
import { addPaipuRecords } from '../app/paipuStore'
import { clearGameSave, loadGameSave, storeGameSave } from '../app/playSave'
import { Link } from '../app/Link'
import { useRecords } from '../app/records/useRecords'
import { usePersistentSetting } from '../app/usePersistentSetting'
import { addBookmarks, addGame, bookmarkId } from '../engine/records'
import { gameRecordOf } from '../game/gameRecord'
import { kyokuLabel, replayUrl, reviewUrl } from '../game/replay'
import { describeSave } from '../game/save'
import type { GameSave } from '../game/selfplay'
import { DIFFICULTIES, difficultyLabel, isDifficulty, makeCpu, type Difficulty } from '../game/difficulty'
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

function DifficultyOptions({
  difficulty,
  onDifficulty,
  practice,
  onPractice,
}: {
  difficulty: Difficulty
  onDifficulty: (d: Difficulty) => void
  practice: boolean
  onPractice: (v: boolean) => void
}) {
  return (
    <fieldset className="play-options">
      <legend>CPU の強さ</legend>
      {DIFFICULTIES.map((d) => (
        <label key={d.id} className="play-option">
          <input type="radio" name="difficulty" value={d.id} checked={difficulty === d.id} onChange={() => onDifficulty(d.id)} />
          <span>
            <strong>{d.label}</strong>
            <span className="play-option-text">{d.description}</span>
          </span>
        </label>
      ))}
      <label className="play-option play-option--practice">
        <input type="checkbox" checked={practice} onChange={(e) => onPractice(e.target.checked)} />
        <span>
          <strong>練習モード</strong>
          <span className="play-option-text">切る牌ごとの受け入れ枚数と、リーチ者に対する危険度のヒントを出します。成績はふつうの対局と分けて記録します。</span>
        </span>
      </label>
    </fieldset>
  )
}

/** CPU対戦 */
export function PlayPage() {
  const [speed, setSpeed] = usePersistentSetting<number>('mahjong-dojo:play-speed', 3)
  const [difficultySetting, setDifficulty] = usePersistentSetting<string>('mahjong-dojo:play-difficulty', 'normal')
  const difficulty: Difficulty = isDifficulty(difficultySetting) ? difficultySetting : 'normal'
  const [practice, setPractice] = usePersistentSetting<boolean>('mahjong-dojo:play-practice', false)
  const [session, setSession] = useState<GameSession | null>(null)
  const [saved, setSaved] = useState<GameSave | null>(() => loadGameSave())
  const { update } = useRecords()
  /** 終わった半荘の id(牌譜を開くため) */
  const [endedId, setEndedId] = useState<string | null>(null)

  // ページを離れたら対局を止める(途中保存は残る)
  useEffect(() => () => session?.game.stop(), [session])

  const start = (resume: GameSave | null) => {
    session?.game.stop()
    if (!resume) clearGameSave()
    setSaved(null)
    setEndedId(null)
    // 続きからは、保存したときの難易度・練習モードで打つ
    const cpu = resume ? (resume.cpu ?? 'strong') : difficulty
    const practiceMode = resume ? resume.practice === true : practice
    const s = startSession({
      speed: speed as GameSpeed,
      resume,
      makeCpu: makeCpu(cpu),
      practice: practiceMode,
      cpu,
      // 局が始まるたびに保存する(ページを閉じても、その局の最初から続けられる)
      onKyokuStart: (save) => storeGameSave({ ...save, cpu, practice: practiceMode }),
      onGameEnd: (paipu, final) => {
        clearGameSave()
        const now = new Date()
        const id = `game-${now.getTime()}`
        update((d) => addGame(d, gameRecordOf(paipu, final, cpu, now, id, practiceMode)))
        addPaipuRecords([{ id, playedAt: now.toISOString(), paipu: JSON.parse(JSON.stringify(paipu)) }])
        // 対局中に「この判断を後で見る」を押した場面を、復習リストに入れる
        const marks = s.game.marks.map((m) => ({
          id: bookmarkId(id, m.kyoku, m.step),
          gameId: id,
          kyoku: m.kyoku,
          step: m.step,
          title: `${kyokuLabel(paipu, m.kyoku).replace(/ 0本場$/, '')} 後で見る`,
          source: 'marker' as const,
          addedAt: now.toISOString(),
        }))
        update((d) => addBookmarks(d, marks))
        setEndedId(id)
      },
    })
    setSession(s)
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
          <p className="play-mode">
            CPU:{difficultyLabel(session.cpu)}
            {session.practice && <span className="play-tag">練習モード</span>}
          </p>
          <PlayTable key={String(session.game.model.title) + session.game.model.qijia} session={session} />
          <PlayResult session={session} onRestart={() => start(null)} replayHref={endedId ? replayUrl(endedId) : null} reviewHref={endedId ? reviewUrl(endedId) : null} />
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
          <p>
            <Link to="/play/stats">これまでの成績</Link>・<Link to="/play/replay">牌譜</Link>
          </p>
          {saved ? (
            <>
              <button type="button" className="button button--primary button--block" onClick={() => start(saved)}>
                続きから({describeSave(saved)}・{difficultyLabel(saved.cpu ?? 'strong')}
                {saved.practice ? '・練習モード' : ''})
              </button>
              <DifficultyOptions difficulty={difficulty} onDifficulty={setDifficulty} practice={practice} onPractice={setPractice} />
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
            <>
              <DifficultyOptions difficulty={difficulty} onDifficulty={setDifficulty} practice={practice} onPractice={setPractice} />
              <button type="button" className="button button--primary button--block" onClick={() => start(null)}>
                対局を始める
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}

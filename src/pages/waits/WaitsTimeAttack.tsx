import { useEffect, useMemo, useState } from 'react'
import { waitsDrill } from '../../drills/waits'
import { useDrillRecorder } from '../../drills/useDrillRecorder'
import { createRng } from '../../engine/random'
import { tileName } from '../../engine/tiles'
import { generateWaitsQuestion, judgeWaits, type WaitsLevel, type WaitsQuestion } from '../../engine/waitsQuestion'
import { WaitsExplanation } from './WaitsExplanation'
import { WaitsQuestionView } from './WaitsQuestionView'

export const TIME_ATTACK_SECONDS = 60

interface Result {
  question: WaitsQuestion
  answer: number[]
  correct: boolean
}

const names = (kinds: readonly number[]) =>
  kinds.length === 0 ? '待ちなし' : kinds.map((k) => tileName({ kind: k, red: false })).join('・')

/** タイムアタック: 制限時間内に何問正解できるか */
export function WaitsTimeAttack({ level, seed, onRestart }: { level: WaitsLevel; seed: number; onRestart: () => void }) {
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult } = useDrillRecorder(waitsDrill)
  const [question, setQuestion] = useState(() => generateWaitsQuestion(level, rng))
  const [results, setResults] = useState<Result[]>([])
  const [endAt, setEndAt] = useState<number | null>(null)
  const [left, setLeft] = useState(TIME_ATTACK_SECONDS)
  const [open, setOpen] = useState<number | null>(null)
  const finished = endAt !== null && left <= 0

  useEffect(() => {
    if (endAt === null) return
    const id = window.setInterval(() => {
      const rest = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setLeft(rest)
      if (rest <= 0) window.clearInterval(id)
    }, 200)
    return () => window.clearInterval(id)
  }, [endAt])

  if (endAt === null) {
    return (
      <div className="waits-ta-start">
        <p>
          {TIME_ATTACK_SECONDS}秒で何問正解できるかに挑戦します。回答するとすぐ次の問題に進みます。解説は終わったあとに見られます。
        </p>
        <button type="button" className="button button--primary button--block" onClick={() => setEndAt(Date.now() + TIME_ATTACK_SECONDS * 1000)}>
          スタート
        </button>
      </div>
    )
  }

  const correctCount = results.filter((r) => r.correct).length
  const last = results[results.length - 1]

  if (finished) {
    const misses = results.map((r, i) => ({ ...r, i })).filter((r) => !r.correct)
    return (
      <section className="drill drill--finished" aria-live="polite">
        <h2 className="drill-summary-title">タイムアップ!</h2>
        <p className="drill-summary-score">
          {TIME_ATTACK_SECONDS}秒で <strong>{correctCount}問</strong> 正解({results.length}問中)
        </p>
        {misses.length > 0 && (
          <>
            <h3 className="eff-heading">間違えた問題</h3>
            <ul className="rec-list">
              {misses.map((r) => (
                <li key={r.i} className="rec-item">
                  {waitsDrill.renderPreview(r.question)}
                  <p className="rec-answer">
                    あなたの回答:{names(r.answer)} / 正解:<strong>{names(r.question.result.waits.map((w) => w.kind))}</strong>
                  </p>
                  <button type="button" className="button waits-ta-open" onClick={() => setOpen(open === r.i ? null : r.i)}>
                    {open === r.i ? '解説を閉じる' : '解説を見る'}
                  </button>
                  {open === r.i && (
                    <div className="waits-ta-explain">
                      <WaitsExplanation question={r.question} answer={r.answer} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="button button--primary button--block" onClick={onRestart}>
          もう一度挑戦する
        </button>
      </section>
    )
  }

  return (
    <section className="drill">
      <div className="drill-status">
        <span className={`waits-ta-time${left <= 10 ? ' waits-ta-time--low' : ''}`}>残り {left}秒</span>
        <span>
          正解 {correctCount} / {results.length}
        </span>
      </div>
      {last && (
        <p className={`waits-ta-last ${last.correct ? 'waits-ta-last--good' : 'waits-ta-last--bad'}`} aria-live="polite">
          {last.correct ? '○ 正解' : `× 不正解(正解:${names(last.question.result.waits.map((w) => w.kind))})`}
        </p>
      )}
      <div className="drill-question">
        <WaitsQuestionView
          key={results.length}
          question={question}
          index={results.length}
          answered={false}
          answer={null}
          onAnswer={(answer) => {
            const correct = judgeWaits(question, answer)
            setResults((r) => [...r, { question, answer, correct }])
            onResult({ question, answer, correct })
            setQuestion(generateWaitsQuestion(level, rng))
          }}
        />
      </div>
    </section>
  )
}

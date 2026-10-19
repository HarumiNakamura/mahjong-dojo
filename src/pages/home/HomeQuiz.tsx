import { useEffect, useState } from 'react'
import { Link } from '../../app/Link'
import { efficiencyDrill } from '../../drills/efficiency'
import { useDrillRecorder } from '../../drills/useDrillRecorder'
import { generateQuestion, type EfficiencyQuestion } from '../../engine/efficiencyQuestion'
import { dateSeed } from '../../engine/progress'
import { createRng } from '../../engine/random'
import { localDate } from '../../engine/records'
import { tileName } from '../../engine/tiles'
import { EfficiencyExplanation } from '../efficiency/EfficiencyExplanation'
import { EfficiencyQuestionView } from '../efficiency/EfficiencyQuestionView'
import '../efficiency/efficiency.css'

/** ホームの「1問だけ何切る」(日付で決まる初級の1問。答えは学習記録に残る) */
export function HomeQuiz() {
  // 問題作りは少し時間がかかるので、最初の表示のあとで作る(ホームを開いたときに操作が止まらないように)
  const [question, setQuestion] = useState<EfficiencyQuestion | null>(null)
  useEffect(() => {
    const id = window.setTimeout(() => setQuestion(generateQuestion('beginner', createRng(dateSeed(`home-${localDate(new Date())}`)))), 50)
    return () => window.clearTimeout(id)
  }, [])
  const [answer, setAnswer] = useState<number | null>(null)
  const { onResult } = useDrillRecorder(efficiencyDrill)
  const correct = question !== null && answer !== null && efficiencyDrill.judge(question, answer)

  return (
    <section className="home-quiz" aria-labelledby="home-quiz-title">
      <h2 id="home-quiz-title" className="home-quiz-title">
        1問だけ何切る
      </h2>
      <p className="home-quiz-lead">14枚から1枚切って、テンパイに一番近づく打牌を選びましょう。</p>
      {!question ? (
        <p className="home-quiz-loading">問題を用意しています…</p>
      ) : (
        <>
          <EfficiencyQuestionView
            question={question}
            answered={answer !== null}
            answer={answer}
            onAnswer={(kind) => {
              setAnswer(kind)
              onResult({ question, answer: kind, correct: efficiencyDrill.judge(question, kind) })
            }}
          />
          {answer !== null && (
            <div className={`home-quiz-result${correct ? ' home-quiz-result--ok' : ''}`} aria-live="polite">
              <p className="home-quiz-verdict">
                {correct ? '正解!' : `残念…(正解は${question.judgement.correctKinds.map((k) => tileName({ kind: k, red: false })).join('・')}切り)`}
              </p>
              <EfficiencyExplanation question={question} answer={answer} />
              <Link to="/practice/efficiency" className="button button--primary button--block">
                続けて練習する
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}

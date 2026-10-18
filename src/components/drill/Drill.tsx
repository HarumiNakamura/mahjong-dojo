import { useEffect, useReducer, useRef, type ReactNode } from 'react'
import { accuracy, drillReducer, initialDrillState, type DrillAction, type DrillState } from './drillState'
import './drill.css'

export interface QuestionViewProps<Q, A> {
  question: Q
  /** 何問目か(0から) */
  index: number
  /** 回答済みなら true(回答の操作を止める) */
  answered: boolean
  /** 回答済みならその答え */
  answer: A | null
  /** 答えを決めたら呼ぶ */
  onAnswer: (answer: A) => void
}

export interface DrillResult<Q, A> {
  question: Q
  answer: A
  correct: boolean
}

export interface DrillProps<Q, A> {
  /** 問題を作る(index は何問目か) */
  makeQuestion: (index: number) => Q
  /** 問題文と回答の操作を表示する */
  renderQuestion: (props: QuestionViewProps<Q, A>) => ReactNode
  /** 正解かどうかを判定する */
  judge: (question: Q, answer: A) => boolean
  /** 正解と、なぜそれが正解なのかを表示する */
  renderExplanation: (result: DrillResult<Q, A>) => ReactNode
  /** 1問答えるごとに呼ばれる(学習記録の保存などに使う) */
  onResult?: (result: DrillResult<Q, A>) => void
  /** 1回の問題数。指定すると最後に結果を表示する */
  totalQuestions?: number
}

/** ドリル共通の部品: 問題 → 回答 → 正誤 → 解説 → 次の問題 */
export function Drill<Q, A>({
  makeQuestion,
  renderQuestion,
  judge,
  renderExplanation,
  onResult,
  totalQuestions,
}: DrillProps<Q, A>) {
  const [state, dispatch] = useReducer(
    drillReducer as (s: DrillState<Q, A>, a: DrillAction<Q, A>) => DrillState<Q, A>,
    undefined,
    () => initialDrillState<Q, A>(makeQuestion(0)),
  )
  const feedbackRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLDivElement>(null)

  // 回答したら正誤と解説が見えるようにスクロールする
  useEffect(() => {
    if (state.phase === 'answered') feedbackRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [state.phase])

  const handleAnswer = (answer: A) => {
    if (state.phase !== 'answering') return
    const correct = judge(state.question, answer)
    dispatch({ type: 'answer', answer, correct })
    onResult?.({ question: state.question, answer, correct })
  }

  const isLast = totalQuestions !== undefined && state.index + 1 >= totalQuestions

  const goNext = () => {
    if (isLast) {
      dispatch({ type: 'finish' })
    } else {
      dispatch({ type: 'next', question: makeQuestion(state.index + 1) })
      questionRef.current?.scrollIntoView?.({ block: 'start' })
    }
  }

  const rate = accuracy(state.stats)

  if (state.phase === 'finished') {
    return (
      <section className="drill drill--finished" aria-live="polite">
        <h2 className="drill-summary-title">結果</h2>
        <p className="drill-summary-score">
          {state.stats.answered}問中 <strong>{state.stats.correct}問</strong> 正解({rate ?? 0}%)
        </p>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={() => dispatch({ type: 'restart', question: makeQuestion(0) })}
        >
          もう一度挑戦する
        </button>
      </section>
    )
  }

  return (
    <section className="drill">
      <div className="drill-status" ref={questionRef}>
        <span>
          第{state.index + 1}問{totalQuestions !== undefined && ` / ${totalQuestions}`}
        </span>
        <span>
          正解 {state.stats.correct} / {state.stats.answered}
          {state.stats.streak >= 2 && <span className="drill-streak">{state.stats.streak}連続正解</span>}
        </span>
      </div>

      <div className="drill-question">
        {renderQuestion({
          question: state.question,
          index: state.index,
          answered: state.phase === 'answered',
          answer: state.answer,
          onAnswer: handleAnswer,
        })}
      </div>

      <div ref={feedbackRef} aria-live="polite">
        {state.phase === 'answered' && state.answer !== null && (
          <div className={`drill-feedback ${state.correct ? 'drill-feedback--correct' : 'drill-feedback--wrong'}`}>
            <p className="drill-verdict">
              <span className="drill-verdict-mark" aria-hidden="true">
                {state.correct ? '○' : '×'}
              </span>
              {state.correct ? '正解!' : '不正解'}
            </p>
            <div className="drill-explanation">
              {renderExplanation({ question: state.question, answer: state.answer, correct: state.correct === true })}
            </div>
          </div>
        )}
      </div>

      {state.phase === 'answered' && (
        <div className="drill-actions">
          <button type="button" className="button button--primary button--block" onClick={goNext}>
            {isLast ? '結果を見る' : '次の問題へ'}
          </button>
        </div>
      )}
    </section>
  )
}

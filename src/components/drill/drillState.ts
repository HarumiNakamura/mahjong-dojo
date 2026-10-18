// ドリルの進み方(問題 → 回答 → 正誤 → 解説 → 次の問題)を表す状態。画面とは独立した純粋な関数。

export type DrillPhase = 'answering' | 'answered' | 'finished'

export interface DrillStats {
  /** 回答した数 */
  answered: number
  /** 正解した数 */
  correct: number
  /** 今の連続正解数 */
  streak: number
}

export interface DrillState<Q, A> {
  /** 何問目か(0から数える) */
  index: number
  question: Q
  phase: DrillPhase
  answer: A | null
  correct: boolean | null
  stats: DrillStats
}

export type DrillAction<Q, A> =
  | { type: 'answer'; answer: A; correct: boolean }
  | { type: 'next'; question: Q }
  | { type: 'finish' }
  | { type: 'restart'; question: Q }

export function initialDrillState<Q, A>(question: Q): DrillState<Q, A> {
  return {
    index: 0,
    question,
    phase: 'answering',
    answer: null,
    correct: null,
    stats: { answered: 0, correct: 0, streak: 0 },
  }
}

export function drillReducer<Q, A>(state: DrillState<Q, A>, action: DrillAction<Q, A>): DrillState<Q, A> {
  switch (action.type) {
    case 'answer': {
      // 1問につき回答は1回だけ
      if (state.phase !== 'answering') return state
      return {
        ...state,
        phase: 'answered',
        answer: action.answer,
        correct: action.correct,
        stats: {
          answered: state.stats.answered + 1,
          correct: state.stats.correct + (action.correct ? 1 : 0),
          streak: action.correct ? state.stats.streak + 1 : 0,
        },
      }
    }
    case 'next':
      if (state.phase !== 'answered') return state
      return { ...state, index: state.index + 1, question: action.question, phase: 'answering', answer: null, correct: null }
    case 'finish':
      if (state.phase !== 'answered') return state
      return { ...state, phase: 'finished' }
    case 'restart':
      return initialDrillState(action.question)
  }
}

/** 正解率(%、整数)。まだ回答がなければ null */
export function accuracy(stats: DrillStats): number | null {
  return stats.answered === 0 ? null : Math.round((stats.correct / stats.answered) * 100)
}

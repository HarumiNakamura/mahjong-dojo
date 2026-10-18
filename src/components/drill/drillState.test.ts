import { describe, expect, it } from 'vitest'
import { accuracy, drillReducer, initialDrillState, type DrillState } from './drillState'

type S = DrillState<string, number>

const start = (): S => initialDrillState<string, number>('Q0')

describe('drillReducer(問題 → 回答 → 正誤 → 解説 → 次の問題)', () => {
  it('最初は1問目の回答待ち', () => {
    const s = start()
    expect(s.index).toBe(0)
    expect(s.phase).toBe('answering')
    expect(s.stats).toEqual({ answered: 0, correct: 0, streak: 0 })
  })

  it('回答すると正誤が決まり、成績が増える', () => {
    const s = drillReducer(start(), { type: 'answer', answer: 3, correct: true })
    expect(s.phase).toBe('answered')
    expect(s.answer).toBe(3)
    expect(s.correct).toBe(true)
    expect(s.stats).toEqual({ answered: 1, correct: 1, streak: 1 })
  })

  it('1問につき回答は1回だけ(2回目は無視)', () => {
    let s = drillReducer(start(), { type: 'answer', answer: 1, correct: false })
    s = drillReducer(s, { type: 'answer', answer: 2, correct: true })
    expect(s.answer).toBe(1)
    expect(s.stats.answered).toBe(1)
  })

  it('次の問題へ進むと回答がリセットされ、成績は残る', () => {
    let s = drillReducer(start(), { type: 'answer', answer: 1, correct: true })
    s = drillReducer(s, { type: 'next', question: 'Q1' })
    expect(s.index).toBe(1)
    expect(s.question).toBe('Q1')
    expect(s.phase).toBe('answering')
    expect(s.answer).toBeNull()
    expect(s.correct).toBeNull()
    expect(s.stats.correct).toBe(1)
  })

  it('回答前に次の問題へは進めない', () => {
    const s = drillReducer(start(), { type: 'next', question: 'Q1' })
    expect(s.index).toBe(0)
    expect(s.question).toBe('Q0')
  })

  it('不正解で連続正解が0に戻る', () => {
    let s = start()
    s = drillReducer(s, { type: 'answer', answer: 1, correct: true })
    s = drillReducer(s, { type: 'next', question: 'Q1' })
    s = drillReducer(s, { type: 'answer', answer: 1, correct: true })
    expect(s.stats.streak).toBe(2)
    s = drillReducer(s, { type: 'next', question: 'Q2' })
    s = drillReducer(s, { type: 'answer', answer: 1, correct: false })
    expect(s.stats).toEqual({ answered: 3, correct: 2, streak: 0 })
  })

  it('回答後に終了でき、やり直すと最初から', () => {
    let s = drillReducer(start(), { type: 'finish' })
    expect(s.phase).toBe('answering')
    s = drillReducer(s, { type: 'answer', answer: 1, correct: true })
    s = drillReducer(s, { type: 'finish' })
    expect(s.phase).toBe('finished')
    s = drillReducer(s, { type: 'restart', question: 'R0' })
    expect(s).toEqual(initialDrillState('R0'))
  })
})

describe('accuracy', () => {
  it('正解率を整数の%で返す', () => {
    expect(accuracy({ answered: 0, correct: 0, streak: 0 })).toBeNull()
    expect(accuracy({ answered: 3, correct: 2, streak: 0 })).toBe(67)
  })
})

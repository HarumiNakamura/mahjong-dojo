import { describe, expect, it } from 'vitest'
import { judgeDiscards, isCorrectDiscard } from './efficiency'
import { explainDiscard, shantenLabel } from './efficiencyExplain'
import { createRng } from './random'
import { DIFFICULTIES, generateQuestion, isGoodQuestion, matchesDifficulty } from './efficiencyQuestion'
import { calcShantenFromTiles } from './shanten'
import { checkTileSet, formatTiles, kindOf, parseTiles } from './tiles'

const p = parseTiles

describe('judgeDiscards(正解の決め方)', () => {
  it('受け入れ枚数が同じ打牌はどちらも正解', () => {
    // 1z と 5z の対子のどちらを切っても 6p9p1s4s の16枚
    const j = judgeDiscards(p('123456m78p23s1155z'))
    expect(j.correctKinds).toEqual([kindOf('z', 1), kindOf('z', 5)])
    expect(j.best.total).toBe(16)
    expect(isCorrectDiscard(j, kindOf('z', 1))).toBe(true)
    expect(isCorrectDiscard(j, kindOf('z', 5))).toBe(true)
    expect(isCorrectDiscard(j, kindOf('p', 8))).toBe(false)
  })

  it('普通はシャンテン数が小さい打牌が正解(嵌張でもテンパイを取る)', () => {
    const j = judgeDiscards(p('123456m789p139s55z'))
    expect(j.backwardCorrect).toBe(false)
    expect(j.correctKinds).toEqual([kindOf('s', 9)])
    expect(j.best.shanten).toBe(0)
    expect(j.best.total).toBe(4)
  })

  it('テンパイの待ちがほとんど残っていなければ、シャンテン戻しが正解', () => {
    // 2s が3枚見えていて、嵌張 2s 待ちは残り1枚
    const j = judgeDiscards(p('123456m789p139s55z'), p('222s'))
    expect(j.backwardCorrect).toBe(true)
    expect(j.bestForward.tile.kind).toBe(kindOf('s', 9))
    expect(j.bestForward.total).toBe(1)
    expect(j.best.shanten).toBe(1)
    expect(j.best.total).toBeGreaterThanOrEqual(16)
    expect(j.correctKinds).not.toContain(kindOf('s', 9))
    // 正解が比較表の先頭に来る
    expect(j.ranked[0]).toBe(j.best)
  })
})

describe('explainDiscard(解説文)', () => {
  it('正解したとき', () => {
    const j = judgeDiscards(p('123456m789p139s55z'))
    const e = explainDiscard(j, kindOf('s', 9))
    expect(e.correct).toBe(true)
    expect(e.summary).toBe('9索切りは受け入れ1種4枚。いちばん多く受け入れられる打牌です。')
    expect(e.backwardReason).toBeNull()
    expect(e.bestTiles.map((t) => formatTiles([{ kind: t.kind, red: false }]))).toEqual(['2s'])
  })

  it('同じ枚数の正解が2つあるとき', () => {
    const j = judgeDiscards(p('123456m78p23s1155z'))
    expect(explainDiscard(j, kindOf('z', 5)).summary).toBe('白切りは受け入れ4種16枚。東切りも同じ枚数なので、どちらも正解です。')
  })

  it('不正解のとき「◯切りは受け入れ△種□枚。最善の×切り(◇枚)より◎枚少ない」', () => {
    const j = judgeDiscards(p('123456m78p23s1155z'))
    const e = explainDiscard(j, kindOf('p', 8))
    expect(e.correct).toBe(false)
    const cut8p = j.ranked.find((o) => o.tile.kind === kindOf('p', 8))!
    expect(e.summary).toBe(
      `8筒切りは受け入れ${cut8p.tiles.length}種${cut8p.total}枚。最善の東切り(16枚)より${16 - cut8p.total}枚少ない。`,
    )
  })

  it('シャンテン数を戻してしまったとき', () => {
    const j = judgeDiscards(p('123456m789p139s55z'))
    const e = explainDiscard(j, kindOf('m', 1))
    expect(e.summary).toContain('テンパイから1シャンテンに戻ってしまいます')
    expect(e.summary).toContain('最善の9索切りならテンパイのまま4枚受け入れられます。')
  })

  it('シャンテン戻しが正解のときは、受け入れ枚数を比べて理由を説明する', () => {
    const j = judgeDiscards(p('123456m789p139s55z'), p('222s'))
    const forward = explainDiscard(j, kindOf('s', 9))
    expect(forward.correct).toBe(false)
    expect(forward.summary).toContain('9索切りはテンパイを保てますが、受け入れ1種1枚しかありません。')
    expect(forward.backwardReason).toContain('テンパイを保つ打牌は、受け入れが最大でも1枚(9索切り)しかありません。')
    expect(forward.backwardReason).toContain(`受け入れが${j.best.total}枚に増え`)
    const best = explainDiscard(j, j.best.tile.kind)
    expect(best.correct).toBe(true)
    expect(best.backwardReason).not.toBeNull()
  })

  it('比較表は全候補を含み、正解が先頭で、回答した打牌に印が付く', () => {
    const j = judgeDiscards(p('123456m78p23s1155z'))
    const e = explainDiscard(j, kindOf('p', 8))
    expect(e.rows).toHaveLength(j.analysis.options.length)
    expect(e.rows[0].correct).toBe(true)
    expect(e.rows.filter((r) => r.chosen).map((r) => r.tile.kind)).toEqual([kindOf('p', 8)])
    expect(e.rows.filter((r) => r.correct)).toHaveLength(2)
  })

  it('手牌にない牌はエラー', () => {
    expect(() => explainDiscard(judgeDiscards(p('123456m78p23s1155z')), kindOf('z', 7))).toThrow()
  })

  it('シャンテン数の呼び方', () => {
    expect(shantenLabel(-1)).toBe('アガリ')
    expect(shantenLabel(0)).toBe('テンパイ')
    expect(shantenLabel(2)).toBe('2シャンテン')
  })
})

describe('generateQuestion(問題の作り方)', () => {
  for (const { id, label } of DIFFICULTIES) {
    it(`${label}: 条件に合う問題ができる`, () => {
      const rng = createRng(100)
      for (let i = 0; i < 8; i++) {
        const q = generateQuestion(id, rng)
        const hand14 = [...q.hand, q.drawn]
        expect(q.hand).toHaveLength(13)
        expect(matchesDifficulty(id, hand14, q.judgement)).toBe(true)
        expect(isGoodQuestion(q.judgement)).toBe(true)
        // 正解は1〜2種類で、手牌にある牌
        expect(q.judgement.correctKinds.length).toBeGreaterThanOrEqual(1)
        expect(q.judgement.correctKinds.length).toBeLessThanOrEqual(2)
        for (const k of q.judgement.correctKinds) expect(hand14.some((t) => t.kind === k)).toBe(true)
        // 見えている牌 = ドラ表示牌 + 4人の河(巡目 − 1 枚ずつ)
        expect(q.visible).toHaveLength(1 + (q.turn - 1) * 4)
        expect(q.ownDiscards).toHaveLength(q.turn - 1)
        // 手牌と見えている牌を合わせても同じ牌は4枚まで、赤5は1枚まで
        expect(checkTileSet([...hand14, ...q.visible])).toEqual([])
      }
    })
  }

  it('初級は1シャンテン、中級は2シャンテン', () => {
    const b = generateQuestion('beginner', createRng(1))
    expect(b.judgement.analysis.shanten).toBe(1)
    const m = generateQuestion('intermediate', createRng(1))
    expect(m.judgement.analysis.shanten).toBe(2)
  })

  it('上級は3シャンテン以上か、七対子が絡む形', () => {
    const rng = createRng(9)
    let chiitoitsu = 0
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('advanced', rng)
      const s = calcShantenFromTiles([...q.hand, q.drawn])
      expect(q.judgement.analysis.shanten >= 3 || s.chiitoitsu <= s.normal).toBe(true)
      if (s.chiitoitsu <= s.normal) chiitoitsu++
    }
    expect(chiitoitsu).toBeGreaterThan(0)
  })

  it('同じシードなら同じ問題', () => {
    const a = generateQuestion('intermediate', createRng(77))
    const b = generateQuestion('intermediate', createRng(77))
    expect(formatTiles(a.hand)).toBe(formatTiles(b.hand))
    expect(a.turn).toBe(b.turn)
  })
})

describe('問題の保存と復元(学習記録用)', () => {
  it('保存した形から同じ局面と正解を作り直せる', async () => {
    const { fromQuestionData, questionKeyOf, toQuestionData } = await import('./efficiencyQuestion')
    const rng = createRng(55)
    for (const { id } of DIFFICULTIES) {
      const q = generateQuestion(id, rng)
      const data = JSON.parse(JSON.stringify(toQuestionData(q)))
      const r = fromQuestionData(data)
      expect(formatTiles(r.hand)).toBe(formatTiles(q.hand))
      expect(r.drawn).toEqual(q.drawn)
      expect(r.visible).toEqual(q.visible)
      expect(r.judgement.correctKinds).toEqual(q.judgement.correctKinds)
      expect(questionKeyOf(r)).toBe(questionKeyOf(q))
    }
  })

  it('形が正しくないデータはエラー', async () => {
    const { fromQuestionData } = await import('./efficiencyQuestion')
    expect(() => fromQuestionData(null)).toThrow()
    expect(() => fromQuestionData({ difficulty: 'beginner', turn: 1, hand: '123m', drawn: '1z', dora: '1z', own: '', others: ['', '', ''] })).toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import { fromQuestionData, questionKeyOf, toQuestionData } from './efficiencyQuestion'
import { createRng } from './random'
import {
  canTsumo,
  currentJudgement,
  declareTsumo,
  difficultyForShanten,
  discardTile,
  reviewTurn,
  riichiDiscardKinds,
  SOLO_TURNS,
  startSoloGame,
  summarizeSolo,
  turnToQuestion,
  type SoloGame,
} from './solo'
import { formatTiles, parseTiles, tilesToCounts } from './tiles'

const p = parseTiles

/** 手牌・ツモ牌・山を指定して局を作る */
function custom(hand: string, drawn: string, wall = '123456789m123456p', turn = 1): SoloGame {
  return {
    doraIndicator: p('1z')[0],
    wall: p(wall),
    hand: p(hand),
    drawn: p(drawn)[0],
    turn,
    discards: [],
    riichiIndex: null,
    logs: [],
    end: null,
  }
}

/** 何切ると同じ基準の最善手で打ち続ける */
function playBest(game: SoloGame): SoloGame {
  let g = game
  while (!g.end) {
    if (canTsumo(g)) return declareTsumo(g)
    const kind = g.riichiIndex !== null ? g.drawn!.kind : currentJudgement(g).correctKinds[0]
    const tiles = [...g.hand, g.drawn!]
    const index = g.riichiIndex !== null ? tiles.length - 1 : tiles.findIndex((t) => t.kind === kind)
    g = discardTile(g, index)
  }
  return g
}

describe('局の始まり', () => {
  it('13枚の配牌と1巡目のツモ、残り17回のツモ', () => {
    const g = startSoloGame(createRng(1))
    expect(g.hand).toHaveLength(13)
    expect(g.drawn).not.toBeNull()
    expect(g.wall).toHaveLength(SOLO_TURNS - 1)
    expect(g.turn).toBe(1)
    // 手牌・ツモ・山・ドラ表示牌を合わせても同じ牌は4枚まで
    const all = [...g.hand, g.drawn!, ...g.wall, g.doraIndicator]
    expect(tilesToCounts(all).every((n) => n <= 4)).toBe(true)
  })
})

describe('進行', () => {
  it('牌効率どおりに打つと最後まで進み、全巡が最善手と一致する', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const g = playBest(startSoloGame(createRng(seed)))
      expect(g.end).not.toBeNull()
      const s = summarizeSolo(g)
      expect(s.matched).toBe(s.scored)
      expect(s.totalDiff).toBe(0)
      expect(s.turns.every((t) => !t.bigMiss)).toBe(true)
    }
  })

  it('18巡目を切ると流局で終わる', () => {
    let g = startSoloGame(createRng(9))
    for (let i = 0; i < SOLO_TURNS; i++) {
      if (g.end) break
      g = discardTile(g, 13) // ツモ切り
    }
    expect(g.end).toEqual({ reason: 'exhausted', turn: SOLO_TURNS })
    expect(g.logs).toHaveLength(SOLO_TURNS)
    expect(g.discards).toHaveLength(SOLO_TURNS)
    expect(g.drawn).toBeNull()
    expect(() => discardTile(g, 0)).toThrow()
  })

  it('毎巡、打牌と最善手の判定を記録する', () => {
    let g = startSoloGame(createRng(4))
    g = discardTile(g, 0)
    const log = g.logs[0]
    expect(log.turn).toBe(1)
    expect(log.judgement).not.toBeNull()
    expect(log.visible).toEqual([g.doraIndicator])
    g = discardTile(g, 0)
    // 2巡目の見えている牌には1巡目の自分の捨て牌が入る
    expect(g.logs[1].visible).toEqual([g.doraIndicator, g.discards[0]])
  })
})

describe('リーチとツモアガリ', () => {
  // 123m456p789s111z + 2z4z → 4z を切ると 2z 単騎、2z を切ると 4z 単騎でテンパイ
  const tenpaiGame = () => custom('123m456p789s111z2z', '4z')

  it('テンパイになる打牌でだけリーチできる', () => {
    const g = tenpaiGame()
    expect(riichiDiscardKinds(g).map((k) => formatTiles([{ kind: k, red: false }]))).toEqual(['2z', '4z'])
    expect(() => discardTile(g, 0, { riichi: true })).toThrow()
  })

  it('リーチ後はツモ切りしかできず、その巡は採点しない', () => {
    let g = discardTile(tenpaiGame(), 13, { riichi: true })
    expect(g.riichiIndex).toBe(0)
    expect(g.logs[0].riichi).toBe(true)
    expect(riichiDiscardKinds(g)).toEqual([])
    expect(() => discardTile(g, 0)).toThrow('ツモ切り')
    g = discardTile(g, 13)
    expect(g.logs[1].afterRiichi).toBe(true)
    expect(g.logs[1].judgement).toBeNull()
    expect(reviewTurn(g.logs[1]).correct).toBeNull()
  })

  it('最後のツモ(海底)ではリーチできない', () => {
    expect(riichiDiscardKinds(custom('123m456p789s111z2z', '4z', '', SOLO_TURNS))).toEqual([])
  })

  it('アガリの形ならツモアガリでき、局が終わる', () => {
    const g = custom('123m456p789s111z2z', '2z')
    expect(canTsumo(g)).toBe(true)
    const done = declareTsumo(g)
    expect(done.end).toEqual({ reason: 'agari', turn: 1 })
    expect(summarizeSolo(done).agari).toBe(true)
    expect(() => declareTsumo(tenpaiGame())).toThrow()
  })
})

describe('振り返り', () => {
  it('差が大きい巡(シャンテン数を戻した・受け入れが4枚以上少ない)を見つける', () => {
    // 6p9p1s4s を待つ 1シャンテン。1z/5z 切りが最善(16枚)
    const base = () => custom('123456m78p23s115z', '5z')
    const best = reviewTurn(discardTile(base(), 13).logs[0])
    expect(best.correct).toBe(true)
    expect(best.diff).toBe(0)
    expect(best.bigMiss).toBe(false)
    // 1m を切ると面子が壊れてシャンテン数が戻る
    const back = reviewTurn(discardTile(base(), 0).logs[0])
    expect(back.correct).toBe(false)
    expect(back.chosenShanten).toBeGreaterThan(1)
    expect(back.bigMiss).toBe(true)
  })

  it('テンパイした巡目と、流局時のテンパイ', () => {
    let g = custom('123m456p789s111z2z', '4z', '5z6z7z')
    g = discardTile(g, 13) // 4z 切りでテンパイ(2z 単騎)
    g = discardTile(g, 13)
    g = discardTile(g, 13)
    g = discardTile(g, 13)
    const s = summarizeSolo(g)
    expect(s.firstTenpaiTurn).toBe(1)
    expect(s.tenpaiTurns).toEqual([1, 2, 3, 4])
    expect(s.agari).toBe(false)
    expect(g.end?.reason).toBe('exhausted')
    expect(s.tenpaiAtEnd).toBe(true)
  })

  it('振り返りの局面は何切るの問題として保存・復元できる', () => {
    let g = startSoloGame(createRng(11))
    g = discardTile(g, 13)
    g = discardTile(g, 2)
    const q = turnToQuestion(g.logs[1])!
    const restored = fromQuestionData(JSON.parse(JSON.stringify(toQuestionData(q))))
    expect(questionKeyOf(restored)).toBe(questionKeyOf(q))
    expect(restored.judgement.correctKinds).toEqual(q.judgement.correctKinds)
    expect(restored.visible).toEqual(q.visible)
  })

  it('難易度の目安', () => {
    expect(difficultyForShanten(0)).toBe('beginner')
    expect(difficultyForShanten(2)).toBe('intermediate')
    expect(difficultyForShanten(4)).toBe('advanced')
  })
})

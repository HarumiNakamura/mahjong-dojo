import { describe, expect, it } from 'vitest'
import { createRng } from '../engine/random'
import { generateScoreQuestion, type ScoreLevel } from '../engine/scoreQuestion'
import { crosscheck } from './scoringCrosscheck'

describe('点数の突き合わせ(自前エンジン と majiang-core)', () => {
  it('ランダムなアガリ形 3,000件で点数・翻・符が一致する', () => {
    const rng = createRng(20261019)
    const levels: ScoreLevel[] = ['beginner', 'intermediate', 'advanced']
    const diffs: string[] = []
    for (let i = 0; i < 3000; i++) {
      const q = generateScoreQuestion(levels[i % 3], rng)
      const r = crosscheck(q)
      if (r.differs) {
        diffs.push(
          `${r.input} 状況${JSON.stringify(q.data)} 自前:${r.ours.han}翻${r.ours.fu}符${r.ours.points}点 [${q.result.yaku.map((y) => y.name)}] majiang:${r.theirs ? `${r.theirs.han}翻${r.theirs.fu}符${r.theirs.points}点` : 'アガれない'}`,
        )
      }
    }
    expect(diffs.slice(0, 10)).toEqual([])
  }, 120000)
})

describe('点数計算のテストケース集でも突き合わせる(役満・カン・特殊なアガリを含む)', () => {
  it('scoring.cases.ts のアガリをすべて比べ、食い違いを一覧にする', async () => {
    const { SCORING_CASES } = await import('../engine/scoring.cases')
    const { calculateScore } = await import('../engine/scoring')
    const { parseTiles } = await import('../engine/tiles')
    const diffs: string[] = []
    let compared = 0
    for (const c of SCORING_CASES) {
      if ('ok' in c.expect) continue
      const { dora, ura, ...ctx } = c.ctx ?? {}
      const hand = parseTiles(c.hand)
      const winTile = parseTiles(c.win)[0]
      const melds = (c.melds ?? []).map(([type, tiles]) => ({ type, tiles: parseTiles(tiles) }))
      const context = { tsumo: false, roundWind: 1, seatWind: 2, ...ctx, doraIndicators: dora ? parseTiles(dora) : [], uraDoraIndicators: ura ? parseTiles(ura) : [] }
      const result = calculateScore({ hand, winTile, melds, context })
      if (!result.ok) continue
      // 天和・地和・本場・供託は majiang-core に渡す形が違うので除く
      if (context.tenhou || context.chiihou) continue
      compared++
      const r = crosscheck({ hand, winTile, melds, context, result, data: {} as never })
      if (r.differs) {
        diffs.push(`${c.id} ${c.title}: ${r.input} 自前:${r.ours.han}翻${r.ours.fu}符${r.ours.points}点 majiang:${r.theirs ? `${r.theirs.han}翻${r.theirs.fu}符${r.theirs.points}点` : 'アガれない'}`)
      }
    }
    expect(compared).toBeGreaterThan(70)
    expect(diffs).toEqual([])
  })
})

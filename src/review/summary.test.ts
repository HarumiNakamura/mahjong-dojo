import legacy from '@kobalab/majiang-ai/legacy'
import { describe, expect, it } from 'vitest'
import { efficiencyDrill } from '../drills/efficiency'
import { kyokuLabel } from '../game/replay'
import { playCpuHanchan } from '../game/selfplay'
import { efficiencyQuestionAt } from './efficiencyQuestionAt'
import { reviewGame } from './reviewGame'
import { rankedCategories, summaryLine } from './summary'

const { paipu } = playCpuHanchan(() => new (legacy('0000'))(), 3)
const review = reviewGame(paipu)

describe('振り返りの一言まとめ', () => {
  it('分かれ目と、一番多い分類を書く', () => {
    const line = summaryLine(review, (k) => kyokuLabel(paipu, k))
    const top = review.turningPoints[0]
    expect(line).toContain(`の${top.title}`)
    expect(line).toMatch(/の指摘が\d+回ありました。$/)
    const cats = rankedCategories(review)
    for (let i = 1; i < cats.length; i++) expect(review.counts[cats[i - 1]]).toBeGreaterThanOrEqual(review.counts[cats[i]])
  })

  it('指摘がなければほめる', () => {
    const empty = { ...review, findings: [], turningPoints: [], counts: { ...review.counts, discard: 0 } }
    expect(summaryLine(empty, () => '')).toContain('見つかりませんでした')
  })
})

describe('牌譜の場面を何切るの問題にする', () => {
  it('打牌の指摘の場面は、何切るの問題になり、保存して作り直せる', () => {
    const f = review.findings.find((x) => x.category === 'discard')!
    const q = efficiencyQuestionAt(paipu, f.kyoku, f.step)
    expect(q).not.toBeNull()
    expect(q!.hand).toHaveLength(13)
    // 指摘で「よりよい」とした牌が、何切るの正解に入っている
    const back = efficiencyDrill.fromData(efficiencyDrill.toData(q!))
    expect(efficiencyDrill.keyOf(back)).toBe(efficiencyDrill.keyOf(q!))
    expect(back.judgement.correctKinds.length).toBeGreaterThan(0)
  })

  it('ツモの前の場面(配牌)は問題にならない', () => {
    expect(efficiencyQuestionAt(paipu, 0, 0)).toBeNull()
  })
})

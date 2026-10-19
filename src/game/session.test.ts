import legacy from '@kobalab/majiang-ai/legacy'
import type { Paipu } from '@kobalab/majiang-core'
import { describe, expect, it } from 'vitest'
import type { HumanReply, HumanRequest } from './humanPlayer'
import { startSession } from './session'

/** 画面の代わりに、決まった打ち方で答える */
function autoReply(r: HumanRequest): HumanReply {
  switch (r.kind) {
    case 'zimo':
      if (r.hule) return { hule: '-' as const }
      if (r.lizhi.length) return { dapai: r.lizhi[r.lizhi.length - 1] + '*' }
      return { dapai: r.dapai[r.dapai.length - 1] }
    case 'dapai':
      if (r.hule) return { hule: '-' as const }
      if (r.peng.length) return { fulou: r.peng[0] }
      return {}
    case 'fulou':
      return { dapai: r.dapai[0] }
    case 'qianggang':
      return { hule: '-' as const }
    default:
      return {}
  }
}

describe('CPU対戦の進行(自分 + CPU 3人)', () => {
  it('自分の操作を待ちながら、半荘を最後まで打てる', async () => {
    const session = startSession(1, () => new (legacy('0101'))())
    session.game.speed = 0 as never
    const kinds = new Set<string>()
    const paipu = await new Promise<Paipu>((resolve) => {
      session.onEnd = resolve
      session.human.subscribe(() => {
        const r = session.human.request
        if (!r) return
        kinds.add(r.kind)
        // 選べる打牌に、喰い替えの牌や手牌にない牌が入っていない
        if (r.kind === 'zimo' || r.kind === 'fulou') {
          for (const p of r.dapai) expect(session.human.shoupai.get_dapai()).toContain(p)
        }
        queueMicrotask(() => session.human.reply(autoReply(r)))
      })
    })
    expect(paipu.log.length).toBeGreaterThanOrEqual(8)
    expect(session.game.final!.scores.reduce((a, b) => a + b, 0)).toBe(100000)
    expect(kinds.has('zimo')).toBe(true)
    expect(kinds.has('jieju')).toBe(true)
  }, 120000)
})

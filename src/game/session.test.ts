import legacy from '@kobalab/majiang-ai/legacy'
import type { Paipu } from '@kobalab/majiang-core'
import { describe, expect, it } from 'vitest'
import type { HumanReply, HumanRequest } from './humanPlayer'
import type { GameRecord } from '../engine/records'
import { gameRecordOf } from './gameRecord'
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
    let ended: GameRecord | null = null
    const session = startSession({
      speed: 1,
      makeCpu: () => new (legacy('0101'))(),
      onGameEnd: (p, final) => (ended = gameRecordOf(p, final, '0101', new Date(0), 'g1')),
    })
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
    // 終局で自分の成績が作られる
    const rec = ended as GameRecord | null
    expect(rec?.rank).toBe(session.game.final!.ranks[0])
    expect(rec?.score).toBe(session.game.final!.scores[0])
    expect(rec?.kyoku).toBe(paipu.log.length)
  }, 120000)
})

describe('途中保存と続きから', () => {
  it('局の始まりごとに保存され、保存した局から最後まで打てる', async () => {
    const saves: import('./selfplay').GameSave[] = []
    const play = (resume?: import('./selfplay').GameSave, stopAfter = Infinity) =>
      new Promise<Paipu | null>((resolve) => {
        const s = startSession({
          speed: 1,
          makeCpu: () => new (legacy('0101'))(),
          resume,
          onKyokuStart: (save) => {
            // 2局目の始まりで「後で見る」の印をつける(配牌の場面)
            if (saves.length === 1 && !resume) s.game.mark()
            saves.push(save)
            // 3局目が始まったところでやめる(ページを閉じたのと同じ)
            if (saves.length > stopAfter) {
              s.game.stop(() => resolve(null))
            }
          },
        })
        s.game.speed = 0 as never
        s.onEnd = resolve
        s.human.subscribe(() => {
          const r = s.human.request
          if (r) queueMicrotask(() => s.human.reply(autoReply(r)))
        })
      })
    expect(await play(undefined, 2)).toBeNull()
    const save = saves[saves.length - 1]
    expect(save.log.length).toBe(2)
    // 印は途中保存に入っている
    expect(save.marks).toEqual([{ kyoku: 0, step: expect.any(Number) }])
    const paipu = await play(JSON.parse(JSON.stringify(save)))
    expect(paipu).not.toBeNull()
    // 前の2局の牌譜も残っている
    expect(paipu!.log.length).toBeGreaterThanOrEqual(8)
    expect(paipu!.log[0]).toEqual(saves[0] === save ? [] : expect.anything())
    expect(paipu!.defen.reduce((a, b) => a + b, 0)).toBe(100000)
    expect(saves[saves.length - 1].marks).toEqual(save.marks)
  }, 120000)
})

import legacy from '@kobalab/majiang-ai/legacy'
import { describe, expect, it } from 'vitest'
import {
  actorOf,
  boardAt,
  clampScene,
  describeStep,
  kyokuCount,
  kyokuLabel,
  kyokuResult,
  lastStep,
  myDiscardSteps,
  mySeat,
  replayUrl,
} from './replay'
import { playCpuHanchan } from './selfplay'

const { paipu } = playCpuHanchan(() => new (legacy('0101'))(), 7)

describe('牌譜の再生', () => {
  it('配牌の局面: 全員13枚、持ち点は局の始まりの値', () => {
    const board = boardAt(paipu, { kyoku: 0, step: 0 })
    for (let l = 0; l < 4; l++) {
      expect(board.shoupai[l].toString().replace(/[^\d]/g, '').length).toBe(13)
      expect(board.he[l]._pai).toEqual([])
    }
    expect(board.defen).toEqual([25000, 25000, 25000, 25000])
    expect(kyokuLabel(paipu, 0)).toBe('東1局 0本場')
  })

  it('局の最後まで進めて精算すると、次の局の始まりの持ち点になる', () => {
    for (let k = 0; k + 1 < kyokuCount(paipu); k++) {
      const board = boardAt(paipu, { kyoku: k, step: lastStep(paipu, k) })
      board.last()
      const next = paipu.log[k + 1][0].qipai as { defen: number[]; jushu: number }
      // qipai.defen は座席順。持ち点はプレイヤー順なので並べ直して比べる
      const byPlayer = [0, 1, 2, 3].map((id) => next.defen[(id + 8 - paipu.qijia - next.jushu) % 4])
      expect(board.defen).toEqual(byPlayer)
    }
  })

  it('手数ごとに河が1枚ずつ増え、手番の座席がわかる', () => {
    const k = 0
    let discards = 0
    for (let s = 1; s <= lastStep(paipu, k); s++) {
      const e = paipu.log[k][s] as Record<string, { l: number } | undefined>
      const board = boardAt(paipu, { kyoku: k, step: s })
      if (e.dapai) {
        discards++
        expect(actorOf(paipu, { kyoku: k, step: s })).toBe(e.dapai.l)
      }
      expect(board.he.reduce((a, h) => a + h._pai.length, 0)).toBe(discards)
    }
  })

  it('自分の座席と、自分の打牌の手数', () => {
    for (let k = 0; k < kyokuCount(paipu); k++) {
      const board = boardAt(paipu, { kyoku: k, step: 0 })
      expect(mySeat(paipu, k)).toBe(board.menfeng(0))
      for (const s of myDiscardSteps(paipu, k)) expect(describeStep(paipu, { kyoku: k, step: s }, false)).toMatch(new RegExp(`^${paipu.player[0]}が.+を切った`))
    }
  })

  it('他家のツモ牌は「全員の手牌」のときだけ書く', () => {
    const k = 0
    const me = mySeat(paipu, k)
    const s = (paipu.log[k] as Record<string, { l: number } | undefined>[]).findIndex((e) => e.zimo && e.zimo.l !== me)
    expect(describeStep(paipu, { kyoku: k, step: s }, false)).toMatch(/^.+がツモ$/)
    expect(describeStep(paipu, { kyoku: k, step: s }, true)).toMatch(/^.+が.+をツモ$/)
  })

  it('局の結果と、範囲外の位置の扱い', () => {
    for (let k = 0; k < kyokuCount(paipu); k++) expect(kyokuResult(paipu, k)).toMatch(/ツモ|ロン|流局/)
    expect(clampScene(paipu, { kyoku: 999, step: 999 })).toEqual({ kyoku: kyokuCount(paipu) - 1, step: lastStep(paipu, kyokuCount(paipu) - 1) })
    expect(clampScene(paipu, { kyoku: -1, step: Number.NaN })).toEqual({ kyoku: 0, step: 0 })
  })

  it('場面の URL', () => {
    expect(replayUrl('game-1')).toBe('/play/replay?g=game-1')
    expect(replayUrl('game-1', { kyoku: 2, step: 15 }, true)).toBe('/play/replay?g=game-1&k=2&s=15&v=all')
  })
})

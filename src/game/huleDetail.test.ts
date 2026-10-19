import legacy from '@kobalab/majiang-ai/legacy'
import { describe, expect, it } from 'vitest'
import { huleDetail, meldFromMianzi, type HuleMessage } from './huleDetail'
import { playCpuHanchan } from './selfplay'

describe('CPU対戦のアガリの内訳(自前の点数計算)', () => {
  it('面子の表記を副露にする', () => {
    expect(meldFromMianzi('m1-23').type).toBe('chi')
    expect(meldFromMianzi('z777=').type).toBe('pon')
    expect(meldFromMianzi('p5555').type).toBe('ankan')
    expect(meldFromMianzi('p5555+').type).toBe('minkan')
    expect(meldFromMianzi('p555+5').type).toBe('kakan')
    expect(meldFromMianzi('m50-5').type).toBe('pon')
  })

  it('自動対局のアガリで、自前の計算の翻・符・点数が majiang-core と一致する', () => {
    let count = 0
    const diffs: string[] = []
    for (let seed = 1; seed <= 8; seed++) {
      const { paipu } = playCpuHanchan(() => new (legacy('0201'))(), seed)
      for (const kyoku of paipu.log as Record<string, Record<string, unknown>>[][]) {
        const qipai = kyoku[0].qipai as { zhuangfeng: number; baopai: string }
        const baopai = [qipai.baopai]
        for (const e of kyoku) {
          if (e.kaigang) baopai.push((e.kaigang as { baopai: string }).baopai)
          if (!e.hule) continue
          const h = e.hule as unknown as HuleMessage
          const r = huleDetail(h, qipai.zhuangfeng, baopai)
          count++
          const ok = r && r.points === h.defen && (h.damanguan || (r.han === h.fanshu && r.fu === h.fu))
          if (!ok) diffs.push(`${h.shoupai} ${h.hupai.map((y) => y.name)} majiang:${h.fanshu}翻${h.fu}符${h.defen} 自前:${r ? `${r.han}翻${r.fu}符${r.points}` : 'なし'}`)
        }
      }
    }
    expect(count).toBeGreaterThan(10)
    expect(diffs).toEqual([])
  }, 300000)
})

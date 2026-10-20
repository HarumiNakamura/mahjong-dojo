import Majiang from '@kobalab/majiang-core'
import { describe, expect, it } from 'vitest'
import { isDaminggang, isGangMianzi, paoMark, paoPayment, paoSeatFromMark, usesAllFour } from './pao'
import { huleWithPao, MLEAGUE_RULE, pingjuTingpai, sigangziPaoSeat } from './rule'

describe('責任払い(パオ)の点数の動き', () => {
  it('子のツモは責任者が全額。積み棒も責任者', () => {
    const r = paoPayment({ winner: 1, ronFrom: null, paoSeat: 2, damanguan: 1, paoDamanguan: 1, changbang: 1, lizhibang: 1 })
    expect(r.fenpei).toEqual([0, 32000 + 300 + 1000, -32300, 0])
    expect(r.defen).toBe(32000)
  })

  it('ロンは放銃者と責任者で半分ずつ。積み棒は責任者が払う', () => {
    const r = paoPayment({ winner: 1, ronFrom: 3, paoSeat: 2, damanguan: 1, paoDamanguan: 1, changbang: 2, lizhibang: 0 })
    expect(r.fenpei).toEqual([0, 32600, -16600, -16000])
    expect(r.defen).toBe(32000)
  })

  it('親のロンで、放銃者が責任者なら全額を1人で払う', () => {
    const r = paoPayment({ winner: 0, ronFrom: 2, paoSeat: 2, damanguan: 1, paoDamanguan: 1, changbang: 0, lizhibang: 0 })
    expect(r.fenpei).toEqual([48000, 0, -48000, 0])
  })

  it('役満が複合したツモは、確定させた役満の分だけ責任者。残りはふつうのツモ', () => {
    // 子が大三元(責任払い)+字一色をツモ。字一色の分はふつうのツモで、責任者も子の 8,000 を払う
    const r = paoPayment({ winner: 1, ronFrom: null, paoSeat: 3, damanguan: 2, paoDamanguan: 1, changbang: 1, lizhibang: 0 })
    expect(r.fenpei).toEqual([-16000, 64300, -8000, -40300])
    expect(r.defen).toBe(64000)
  })

  it('席と印の変換', () => {
    expect(paoSeatFromMark(1, '+')).toBe(2)
    expect(paoSeatFromMark(1, '=')).toBe(3)
    expect(paoSeatFromMark(1, '-')).toBe(0)
    for (const seat of [0, 2, 3]) expect(paoSeatFromMark(1, paoMark(1, seat))).toBe(seat)
  })

  it('カン・大明槓の見分け', () => {
    expect(isGangMianzi('m5555+')).toBe(true)
    expect(isGangMianzi('m555+5')).toBe(true)
    expect(isGangMianzi('z1111')).toBe(true)
    expect(isGangMianzi('z111=')).toBe(false)
    expect(isDaminggang('m5505+')).toBe(true)
    expect(isDaminggang('m555+5')).toBe(false)
    expect(isDaminggang('z1111')).toBe(false)
  })
})

describe('CPU対戦の点数計算(ライブラリの補正)', () => {
  const param = (menfeng: number, changbang = 0) => Majiang.Util.hule_param({ rule: MLEAGUE_RULE, menfeng, changbang })

  it('大三元の責任払いのロンで、積み棒は鳴かせた人が払う', () => {
    // 南家(1)が3つ目の中を下家(2)からポンして大三元。東家(0)からロン
    const shoupai = Majiang.Shoupai.fromString('m123p5,z555=,z666-,z777+')
    const r = Majiang.Util.hule(shoupai, 'p5-', param(1, 1))!
    expect(r.hupai.map((h) => h.name)).toContain('大三元')
    expect(r.fenpei).toEqual([-16000, 32300, -16300, 0])
  })

  it('四槓子の4つ目を大明槓させた人は責任払い(ツモは全額)', () => {
    const shoupai = Majiang.Shoupai.fromString('p5,m1111,s2222,z3333=,m9999+').zimo('p5')
    const plain = huleWithPao(shoupai, null, param(1))!
    expect(plain.hupai.map((h) => h.name)).toContain('四槓子')
    expect(plain.fenpei).toEqual([-16000, 32000, -8000, -8000])
    const pao = huleWithPao(shoupai, null, param(1), 2)!
    expect(pao.fenpei).toEqual([0, 32000, -32000, 0])
    expect(pao.hupai.find((h) => h.name === '四槓子')?.baojia).toBe('+')
  })

  it('大明槓で4つ目のカンをした人について、鳴かせた人を記録する', () => {
    const shoupai = [0, 1, 2, 3].map(() => Majiang.Shoupai.fromString('m1112223334445'))
    shoupai[1] = Majiang.Shoupai.fromString('m555p1,s2222,z3333=,m9999+')
    const he = [0, 1, 2, 3].map(() => new Majiang.He())
    he[0].dapai('m5')
    const game = {
      _model: { lunban: 0, he, shoupai },
      _n_gang: [0, 3, 0, 0],
      add_paipu() {},
      call_players() {},
    }
    ;(Majiang.Game.prototype as unknown as { fulou(this: unknown, m: string): void }).fulou.call(game, 'm5555-')
    expect(game._model.lunban).toBe(1)
    expect(sigangziPaoSeat(game, 1)).toBe(0)
  })

  it('流局時、副露も含めて4枚使っている当たり牌はノーテン', () => {
    // 1萬をポンしていて、1萬の単騎待ち
    const noten = Majiang.Shoupai.fromString('p123456s789m1,m111-')
    expect(Majiang.Util.tingpai(noten)).toEqual(['m1'])
    expect(pingjuTingpai(noten)).toEqual([])
    // 赤5も数える
    expect(pingjuTingpai(Majiang.Shoupai.fromString('p123456s789m5,m550-'))).toEqual([])
    // ふつうのテンパイはそのまま
    expect(pingjuTingpai(Majiang.Shoupai.fromString('p123456s99m23,m111-'))).toEqual(['m1', 'm4'])
  })

  it('4枚使いの判定', () => {
    expect(usesAllFour('m1', 1, ['m111-'])).toBe(true)
    expect(usesAllFour('m1', 1, ['m1-23'])).toBe(false)
    expect(usesAllFour('p5', 0, ['p505='])).toBe(false)
    expect(usesAllFour('p5', 1, ['p505='])).toBe(true)
  })
})

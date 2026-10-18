import { describe, expect, it } from 'vitest'
import { formatTsumo, limitRows, tableCell } from './scoreTable'

describe('点数早見表', () => {
  it('子の基本的な点数', () => {
    expect(tableCell(30, 1, false)).toMatchObject({ ron: 1000, tsumo: { fromDealer: 500, fromNonDealer: 300 } })
    expect(tableCell(40, 3, false).ron).toBe(5200)
    expect(tableCell(25, 2, false).ron).toBe(1600)
    expect(tableCell(20, 2, false).tsumo).toEqual({ fromDealer: 700, fromNonDealer: 400 })
  })

  it('親の基本的な点数', () => {
    expect(tableCell(30, 1, true)).toMatchObject({ ron: 1500, tsumo: { fromDealer: null, fromNonDealer: 500 } })
    expect(tableCell(40, 3, true).ron).toBe(7700)
    expect(tableCell(20, 2, true).tsumo).toEqual({ fromDealer: null, fromNonDealer: 700 })
  })

  it('切り上げ満貫(30符4翻・60符3翻)は満貫', () => {
    expect(tableCell(30, 4, false)).toMatchObject({ ron: 8000, limit: 'mangan', kiriage: true })
    expect(tableCell(60, 3, true)).toMatchObject({ ron: 12000, limit: 'mangan', kiriage: true })
    expect(tableCell(30, 3, false).kiriage).toBe(false)
  })

  it('基本点が2,000点以上なら満貫(70符3翻など)', () => {
    expect(tableCell(70, 3, false)).toMatchObject({ ron: 8000, limit: 'mangan', kiriage: false })
  })

  it('ありえない組み合わせは空欄', () => {
    expect(tableCell(20, 2, false).ron).toBeNull()
    expect(tableCell(20, 1, false).tsumo).toBeNull()
    expect(tableCell(25, 1, false).ron).toBeNull()
    expect(tableCell(25, 2, false).tsumo).toBeNull()
    expect(tableCell(25, 3, false).tsumo).toEqual({ fromDealer: 1600, fromNonDealer: 800 })
  })

  it('満貫以上の表', () => {
    const ko = limitRows(false)
    expect(ko.map((r) => r.ron)).toEqual([8000, 12000, 16000, 24000, 32000])
    expect(formatTsumo(ko[0].tsumo)).toBe('2,000/4,000')
    const oya = limitRows(true)
    expect(oya.map((r) => r.ron)).toEqual([12000, 18000, 24000, 36000, 48000])
    expect(formatTsumo(oya[0].tsumo)).toBe('4,000オール')
  })
})

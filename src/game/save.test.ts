import { describe, expect, it } from 'vitest'
import { describeSave, parseGameSave } from './save'

const ok = { version: 1, qijia: 2, zhuangfeng: 1, jushu: 2, changbang: 1, lizhibang: 1, defen: [30000, 25000, 24000, 20000], log: [[], []] }

describe('CPU対戦の途中保存', () => {
  it('正しい形なら読み込める', () => {
    expect(parseGameSave(JSON.parse(JSON.stringify(ok)))).toEqual(ok)
    expect(describeSave(ok as never)).toBe('南3局 1本場')
  })
  it('壊れた形・点数の合計が合わないものは読み込まない', () => {
    expect(parseGameSave(null)).toBeNull()
    expect(parseGameSave({ ...ok, version: 2 })).toBeNull()
    expect(parseGameSave({ ...ok, jushu: 4 })).toBeNull()
    expect(parseGameSave({ ...ok, defen: [30000, 25000, 24000] })).toBeNull()
    expect(parseGameSave({ ...ok, lizhibang: 0 })).toBeNull()
    expect(parseGameSave({ ...ok, log: 'x' })).toBeNull()
  })
})

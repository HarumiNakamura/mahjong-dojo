import { describe, expect, it } from 'vitest'
import { decodeShareData, encodeShareData, sharePath, xIntentUrl } from './share'

describe('問題の共有', () => {
  it('問題データを URL に入れられる形にして、元に戻せる', () => {
    const data = { hand: '123m456p789s1122z', level: 'beginner', list: [1, 2, 3], note: '日本語も大丈夫' }
    const text = encodeShareData(data)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeShareData(text)).toEqual(data)
  })

  it('共有のパスと X の投稿 URL', () => {
    expect(sharePath('efficiency', { a: 1 })).toMatch(/^\/q\/efficiency\?d=[A-Za-z0-9_-]+$/)
    const url = 'https://example.com/q/x?d=1'
    expect(xIntentUrl('何切る問題', url)).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent('何切る問題')}&url=${encodeURIComponent(url)}`,
    )
    expect(xIntentUrl('a&b', url)).toContain('text=a%26b&')
  })

  it('壊れたデータはエラー', () => {
    expect(() => decodeShareData('!!!')).toThrow()
  })
})

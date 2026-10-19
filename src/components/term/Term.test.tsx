import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Glossary } from '../article/Glossary'
import { Term } from './Term'

describe('用語部品', () => {
  it('HTML では用語集の該当箇所へのふつうのリンクになる', () => {
    const html = renderToStaticMarkup(<Term id="面子" />)
    expect(html).toContain('href="/learn/glossary#mentsu"')
    expect(html).toContain('class="term"')
    expect(html).toContain('>面子<')
    expect(renderToStaticMarkup(<Term id="両面待ち">りゃんめん</Term>)).toContain('#ryanmen')
  })

  it('知らない用語はただの文字にする', () => {
    expect(renderToStaticMarkup(<Term id="知らない言葉">あいう</Term>)).toBe('あいう')
  })
})

describe('用語集', () => {
  it('全用語に目印(id)・読み・意味が出る', () => {
    const html = renderToStaticMarkup(<Glossary />)
    expect(html).toContain('id="mentsu"')
    expect(html).toContain('メンツ')
    expect(html).toContain('順子か刻子の3枚1組')
  })
})

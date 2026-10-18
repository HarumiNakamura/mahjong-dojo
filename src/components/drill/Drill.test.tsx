import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Drill } from './Drill'

describe('Drill', () => {
  it('最初は問題だけを表示し、正誤・解説・次へボタンはまだ出さない', () => {
    const html = renderToStaticMarkup(
      <Drill<string, number>
        totalQuestions={5}
        makeQuestion={(i) => `問題${i + 1}`}
        judge={() => true}
        renderQuestion={({ question }) => <p>{question}</p>}
        renderExplanation={() => <p>解説</p>}
      />,
    )
    expect(html).toContain('問題1')
    expect(html).toContain('第1問 / 5')
    expect(html).not.toContain('正解!')
    expect(html).not.toContain('解説')
    expect(html).not.toContain('次の問題へ')
  })
})

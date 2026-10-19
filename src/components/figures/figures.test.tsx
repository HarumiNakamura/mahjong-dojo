import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ARTICLES } from '../../content/articles'
import { FIGURES } from '../../content/figures'
import { ArticleFigure } from './ArticleFigure'
import { FIGURE_COMPONENTS } from './registry'

describe('記事の図解', () => {
  it('題名・代替テキストと部品がそろっている', () => {
    expect(Object.keys(FIGURE_COMPONENTS).sort()).toEqual(Object.keys(FIGURES).sort())
  })

  for (const id of Object.keys(FIGURES)) {
    it(`${id} を描画でき、代替テキストが付く`, () => {
      const html = renderToStaticMarkup(<ArticleFigure id={id} />)
      expect(html).toContain('role="img"')
      expect(html).toContain(`aria-label="${FIGURES[id].alt}"`)
      expect(html).toContain('<svg viewBox="0 0 360 ')
    })
  }

  it('どの図もいずれかの記事で使っている', () => {
    const used = new Set(ARTICLES.flatMap((a) => a.blocks.flatMap((b) => (b.type === 'figure' ? [b.id] : []))))
    for (const id of Object.keys(FIGURES)) expect(used.has(id), id).toBe(true)
  })
})

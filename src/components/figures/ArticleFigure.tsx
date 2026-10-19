import { FIGURES } from '../../content/figures'
import { FIGURE_COMPONENTS } from './registry'
import './figures.css'

/** 記事に埋め込む図解。図全体を1枚の画像として読み上げ(代替テキスト)、題名を下に出す */
export function ArticleFigure({ id }: { id: string }) {
  const info = FIGURES[id]
  const Figure = FIGURE_COMPONENTS[id]
  if (!info || !Figure) return null
  return (
    <figure className="article-figure">
      <div className="article-figure-art" role="img" aria-label={info.alt}>
        <Figure />
      </div>
      <figcaption>{info.title}</figcaption>
    </figure>
  )
}

import { Fragment } from 'react'
import { Link } from '../../app/Link'
import { findPageInfo } from '../../app/routes'
import type { Block, Inline } from '../../content/markdown'
import { parseTiles } from '../../engine/tiles'
import { Term } from '../term/Term'
import { Hand } from '../tile/Hand'
import { ArticleFigure } from '../figures/ArticleFigure'
import { Glossary } from './Glossary'
import { Tile } from '../tile/Tile'
import './article.css'

export function InlineNodes({ nodes }: { nodes: readonly Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'text') return <Fragment key={i}>{n.text}</Fragment>
        if (n.type === 'strong')
          return (
            <strong key={i}>
              <InlineNodes nodes={n.children} />
            </strong>
          )
        if (n.type === 'link')
          return n.href.startsWith('/') ? (
            <Link key={i} to={n.href}>
              <InlineNodes nodes={n.children} />
            </Link>
          ) : (
            <a key={i} href={n.href} target="_blank" rel="noopener noreferrer">
              <InlineNodes nodes={n.children} />
            </a>
          )
        if (n.type === 'term')
          return (
            <Term key={i} id={n.key}>
              {n.text}
            </Term>
          )
        return (
          <span key={i} className="article-inline-tiles">
            {parseTiles(n.tiles).map((t, j) => (
              <Tile key={j} tile={t} showLabel={false} />
            ))}
          </span>
        )
      })}
    </>
  )
}

/** 記事に埋め込むドリルの案内 */
export function DrillCard({ path }: { path: string }) {
  const page = findPageInfo(path)
  if (!page) return null
  return (
    <div className="article-drill">
      <p className="article-drill-label">ドリルで練習</p>
      <p className="article-drill-title">{page.title}</p>
      <p className="article-drill-text">{page.description}</p>
      <Link to={path} className="button button--primary button--block">
        {page.title}を解いてみる
      </Link>
    </div>
  )
}

export function ArticleBody({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="article-body">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return b.level === 2 ? (
              <h2 key={i} id={b.id}>
                {b.text}
              </h2>
            ) : (
              <h3 key={i} id={b.id}>
                {b.text}
              </h3>
            )
          case 'paragraph':
            return (
              <p key={i}>
                <InlineNodes nodes={b.children} />
              </p>
            )
          case 'note':
            return (
              <p key={i} className="article-note">
                <InlineNodes nodes={b.children} />
              </p>
            )
          case 'list': {
            const items = b.items.map((it, j) => (
              <li key={j}>
                <InlineNodes nodes={it} />
              </li>
            ))
            return b.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
          }
          case 'table':
            return (
              <div key={i} className="article-table-wrap">
                <table className="article-table">
                  <thead>
                    <tr>
                      {b.header.map((c, j) => (
                        <th key={j} scope="col">
                          <InlineNodes nodes={c} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k}>
                            <InlineNodes nodes={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'tiles':
            return (
              <figure key={i} className="article-tiles">
                <Hand tiles={parseTiles(b.tiles)} />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            )
          case 'drill':
            return <DrillCard key={i} path={b.path} />
          case 'glossary':
            return <Glossary key={i} />
          case 'figure':
            return <ArticleFigure key={i} id={b.id} />
          case 'points':
            return (
              <section key={i} className="article-points" aria-label="この記事でわかること">
                <p className="article-points-title">この記事でわかること</p>
                <ul>
                  {b.items.map((it, j) => (
                    <li key={j}>
                      <InlineNodes nodes={it} />
                    </li>
                  ))}
                </ul>
              </section>
            )
        }
      })}
    </div>
  )
}

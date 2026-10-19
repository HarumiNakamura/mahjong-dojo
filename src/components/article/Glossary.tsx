import { useEffect, useState } from 'react'
import { Link } from '../../app/Link'
import { scrollToHash } from '../../app/router'
import { KANA_ROWS, kanaRow, sortByReading, TERM_CATEGORIES, TERMS, type Term, type TermCategory } from '../../content/terms'
import { parseTiles } from '../../engine/tiles'
import { Tile } from '../tile/Tile'

type View = 'category' | 'kana'

function TermEntry({ term }: { term: Term }) {
  return (
    <div className="glossary-entry" id={term.id}>
      <dt>
        <a href={`#${term.id}`} className="glossary-word">
          {term.word}
        </a>
        <span className="glossary-reading">{term.reading}</span>
        {term.aliases && term.aliases.length > 0 && <span className="glossary-aliases">({term.aliases.join('・')})</span>}
      </dt>
      <dd>
        <p className="glossary-meaning">{term.meaning}</p>
        {term.tiles && (
          <span className="glossary-tiles" aria-label={`牌の例: ${term.tiles}`}>
            {parseTiles(term.tiles).map((t, i) => (
              <Tile key={i} tile={t} showLabel={false} />
            ))}
          </span>
        )}
        {term.article && (
          <p className="glossary-more">
            <Link to={term.article}>詳しい説明</Link>
          </p>
        )}
      </dd>
    </div>
  )
}

/** 用語集(src/content/terms.ts の全用語)。分類ごと/50音順に切り替えられる */
export function Glossary() {
  const [view, setView] = useState<View>('category')
  const [category, setCategory] = useState<TermCategory | null>(null)

  // URL の #目印 の用語へスクロールする(絞り込みを外してから)
  useEffect(() => {
    const onHash = () => {
      if (!window.location.hash) return
      setCategory(null)
      scrollToHash(window.location.hash)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const groups =
    view === 'category'
      ? TERM_CATEGORIES.filter((c) => category === null || c === category).map((c) => ({
          id: `cat-${TERM_CATEGORIES.indexOf(c)}`,
          title: c,
          terms: TERMS.filter((t) => t.category === c),
        }))
      : KANA_ROWS.map((row, i) => ({ id: `kana-${i}`, title: `${row}行`, terms: sortByReading(TERMS.filter((t) => kanaRow(t.reading) === row)) })).filter(
          (g) => g.terms.length > 0,
        )

  return (
    <div className="glossary">
      <div className="glossary-views" role="group" aria-label="並べ方">
        <button type="button" className="glossary-chip" aria-pressed={view === 'category'} onClick={() => setView('category')}>
          分類ごと
        </button>
        <button type="button" className="glossary-chip" aria-pressed={view === 'kana'} onClick={() => setView('kana')}>
          50音順
        </button>
      </div>
      {view === 'category' ? (
        <div className="glossary-filter" role="group" aria-label="分類">
          <button type="button" className="glossary-chip" aria-pressed={category === null} onClick={() => setCategory(null)}>
            すべて
          </button>
          {TERM_CATEGORIES.map((c) => (
            <button key={c} type="button" className="glossary-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : (
        <nav className="glossary-filter" aria-label="50音の索引">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="glossary-chip">
              {g.title.replace('行', '')}
            </a>
          ))}
        </nav>
      )}
      {groups.map((g) => (
        <section key={g.id} className="glossary-group">
          <h3 id={g.id}>
            {g.title}
            <span className="glossary-count">{g.terms.length}語</span>
          </h3>
          <dl>
            {g.terms.map((t) => (
              <TermEntry key={t.id} term={t} />
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

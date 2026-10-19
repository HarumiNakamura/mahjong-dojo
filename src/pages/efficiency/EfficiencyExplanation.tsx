import { Fragment } from 'react'
import { Link } from '../../app/Link'
import { Term } from '../../components/term/Term'
import { Tile } from '../../components/tile/Tile'
import { explainDiscard, shantenLabel, type ComparisonRow } from '../../engine/efficiencyExplain'
import type { EfficiencyQuestion } from '../../engine/efficiencyQuestion'
import { tileName } from '../../engine/tiles'

function Row({ r, max }: { r: ComparisonRow; max: number }) {
  return (
    <tr className={`${r.correct ? 'eff-row--correct' : ''}${r.chosen ? ' eff-row--chosen' : ''}`}>
      <td>
        <span className="eff-table-tile">
          <Tile tile={r.tile} showLabel={false} />
          {tileName(r.tile)}
        </span>
        {r.correct && <span className="eff-tag eff-tag--correct">正解</span>}
        {r.chosen && <span className="eff-tag">あなた</span>}
      </td>
      <td>{shantenLabel(r.shanten)}</td>
      <td className="eff-bar-cell">
        <span className="eff-bar" aria-hidden="true">
          <span className="eff-bar-fill" style={{ width: `${max ? (r.total / max) * 100 : 0}%` }} />
        </span>
        <span className="eff-bar-label">
          {r.kinds}種{r.total}枚
        </span>
      </td>
    </tr>
  )
}

export function EfficiencyExplanation({ question, answer }: { question: EfficiencyQuestion; answer: number }) {
  const e = explainDiscard(question.judgement, answer, [...question.hand, question.drawn])
  const forward = e.rows.filter((r) => !r.backward)
  const backward = e.rows.filter((r) => r.backward)
  const max = Math.max(1, ...e.rows.map((r) => r.total))
  return (
    <>
      <p>{e.summary}</p>
      {e.reasons.length > 0 && (
        <ul className="eff-reasons">
          {e.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {e.backwardReason && (
        <p className="eff-backward">
          <strong>
            <Term id="shanten-modoshi">シャンテン戻し</Term>が正解の理由:
          </strong>
          {e.backwardReason}
        </p>
      )}

      <h3 className="eff-heading">
        最善の{tileName(e.bestTile)}切りの<Term id="yukohai">有効牌</Term>
      </h3>
      <ul className="eff-best-tiles">
        {e.bestTiles.map((t) => (
          <li key={t.kind}>
            <Tile tile={{ kind: t.kind, red: false }} showLabel={false} />
            <span>{t.remaining}枚</span>
          </li>
        ))}
      </ul>

      <h3 className="eff-heading">すべての打牌の比較</h3>
      <table className="eff-table">
        <thead>
          <tr>
            <th scope="col">打牌</th>
            <th scope="col">
              <Term id="shanten">シャンテン数</Term>
            </th>
            <th scope="col">
              <Term id="ukeire">受け入れ</Term>
            </th>
          </tr>
        </thead>
        <tbody>
          {forward.map((r) => (
            <Row key={r.tile.kind} r={r} max={max} />
          ))}
          {backward.length > 0 && (
            <Fragment>
              <tr className="eff-table-sep">
                <th colSpan={3} scope="rowgroup">
                  シャンテン数が戻る打牌(<Term id="shanten-modoshi">戻し</Term>)
                </th>
              </tr>
              {backward.map((r) => (
                <Row key={r.tile.kind} r={r} max={max} />
              ))}
            </Fragment>
          )}
        </tbody>
      </table>

      {e.articles.length > 0 && (
        <p className="eff-articles">
          くわしく:
          {e.articles.map((a, i) => (
            <Fragment key={a.path}>
              {i > 0 && '・'}
              <Link to={a.path}>{a.label}</Link>
            </Fragment>
          ))}
        </p>
      )}
    </>
  )
}

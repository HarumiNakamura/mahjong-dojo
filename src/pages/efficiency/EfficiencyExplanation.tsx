import { Tile } from '../../components/tile/Tile'
import { explainDiscard, shantenLabel } from '../../engine/efficiencyExplain'
import type { EfficiencyQuestion } from '../../engine/efficiencyQuestion'
import { tileName } from '../../engine/tiles'

export function EfficiencyExplanation({ question, answer }: { question: EfficiencyQuestion; answer: number }) {
  const e = explainDiscard(question.judgement, answer)
  return (
    <>
      <p>{e.summary}</p>
      {e.backwardReason && (
        <p className="eff-backward">
          <strong>シャンテン戻しが正解の理由:</strong>
          {e.backwardReason}
        </p>
      )}

      <h3 className="eff-heading">最善の{tileName(e.bestTile)}切りの有効牌</h3>
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
            <th scope="col">シャンテン数</th>
            <th scope="col">受け入れ</th>
          </tr>
        </thead>
        <tbody>
          {e.rows.map((r) => (
            <tr key={r.tile.kind} className={`${r.correct ? 'eff-row--correct' : ''}${r.chosen ? ' eff-row--chosen' : ''}`}>
              <td>
                <span className="eff-table-tile">
                  <Tile tile={r.tile} showLabel={false} />
                  {tileName(r.tile)}
                </span>
                {r.correct && <span className="eff-tag eff-tag--correct">正解</span>}
                {r.chosen && <span className="eff-tag">あなた</span>}
              </td>
              <td>
                {shantenLabel(r.shanten)}
                {r.backward && <span className="eff-back">戻し</span>}
              </td>
              <td>
                {r.kinds}種{r.total}枚
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

import type { LimitName } from '../../engine/scoring'
import { formatTsumo, limitRows, TABLE_FU, TABLE_HAN, tableCell } from '../../engine/scoreTable'

const f = (n: number) => n.toLocaleString('ja-JP')

/** ツモの支払いを「/」の後で折り返せるように表示する(狭い画面用) */
function TsumoText({ value }: { value: { fromDealer: number | null; fromNonDealer: number } }) {
  const [a, b] = formatTsumo(value).split('/')
  return b === undefined ? (
    <>{a}</>
  ) : (
    <>
      {a}/<wbr />
      {b}
    </>
  )
}

/** 符×翻の点数表。highlight のマスを強調する。fuRows で表示する符を絞れる */
export function ScoreTableView({
  dealer,
  highlight,
  fuRows,
}: {
  dealer: boolean
  highlight?: { fu: number; han: number; tsumo: boolean } | null
  fuRows?: readonly number[]
}) {
  const rows = fuRows ?? TABLE_FU
  return (
    <div className="score-table-wrap">
      <table className="score-table">
        <caption className="visually-hidden">{dealer ? '親' : '子'}の点数表(上: ロン、下: ツモ)</caption>
        <thead>
          <tr>
            <th scope="col">符</th>
            {TABLE_HAN.map((h) => (
              <th key={h} scope="col">
                {h}翻
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((fu) => (
            <tr key={fu}>
              <th scope="row">{fu}符</th>
              {TABLE_HAN.map((han) => {
                const c = tableCell(fu, han, dealer)
                const hit = highlight && highlight.fu === fu && highlight.han === han
                return (
                  <td key={han} className={`${hit ? 'score-cell--hit' : ''}${c.limit ? ' score-cell--limit' : ''}`}>
                    <span className={`score-ron${hit && !highlight!.tsumo ? ' score-mark' : ''}`}>{c.ron === null ? '−' : f(c.ron)}</span>
                    <span className={`score-tsumo${hit && highlight!.tsumo ? ' score-mark' : ''}`}>{c.tsumo === null ? '−' : <TsumoText value={c.tsumo} />}</span>
                    {c.kiriage && <span className="score-kiriage">切上満貫</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 満貫以上の表 */
export function LimitTableView({ dealer, highlight }: { dealer: boolean; highlight?: LimitName | null }) {
  return (
    <div className="score-table-wrap">
      <table className="score-table score-table--limit">
        <caption className="visually-hidden">{dealer ? '親' : '子'}の満貫以上の点数</caption>
        <thead>
          <tr>
            <th scope="col">区分</th>
            <th scope="col">翻数</th>
            <th scope="col">ロン</th>
            <th scope="col">ツモ</th>
          </tr>
        </thead>
        <tbody>
          {limitRows(dealer).map((r) => (
            <tr key={r.limit} className={highlight === r.limit ? 'score-row--hit' : ''}>
              <th scope="row">{r.label}</th>
              <td className="score-han-label">{r.hanLabel}</td>
              <td>{f(r.ron)}</td>
              <td>{formatTsumo(r.tsumo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

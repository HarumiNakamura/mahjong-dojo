import { dealsIn } from '../../engine/danger'
import type { PushFoldQuestion } from '../../engine/pushfoldQuestion'
import { tileName } from '../../engine/tiles'
import { RiichiReveal } from '../defense/SafetyExplanation'

const pct = (x: number) => `${Math.round(x * 100)}%`
const yen = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}点`

/** 押し引きの内訳と一言ルール */
export function PushFoldExplanation({ question: q }: { question: PushFoldQuestion }) {
  const r = q.result
  const verdictText =
    r.verdict === 'either'
      ? `押しと降りの差は約${yen(Math.abs(r.diff))}しかないので、どちらも正解です`
      : r.verdict === 'push'
        ? `押しが約${yen(r.diff)}得`
        : `降りが約${yen(-r.diff)}得`
  const hit = dealsIn(q.situation, q.discard).length > 0
  const name = tileName({ kind: q.discard, red: false })
  return (
    <div className="def-expl">
      <p className="pf-summary">
        和了率 約{pct(r.winRate)}・打点{yen(q.input.myValue)}、放銃率 約{pct(r.dealInRate)}・相手の打点{yen(r.opponentValue)} →{' '}
        <strong>{verdictText}</strong>
      </p>
      <p className="def-rule">{r.rule}</p>
      <table className="pf-table">
        <tbody>
          <tr>
            <th scope="row">押したときのアガリ率</th>
            <td>約{pct(r.winRate)}</td>
          </tr>
          <tr>
            <th scope="row">押したときの放銃率</th>
            <td>
              約{pct(r.dealInRate)}({name} {q.safety.danger}% + この先の押し)
            </td>
          </tr>
          <tr>
            <th scope="row">相手のツモアガリ</th>
            <td>
              約{pct(r.opponentTsumoRate)}(払う点数 約{yen(r.tsumoCost)})
            </td>
          </tr>
          <tr>
            <th scope="row">押しの期待値</th>
            <td>{r.pushEV > 0 ? '+' : ''}{yen(r.pushEV)}</td>
          </tr>
          <tr>
            <th scope="row">降りの期待値</th>
            <td>{yen(r.foldEV)}</td>
          </tr>
        </tbody>
      </table>
      <p className="def-hint">
        押しの期待値 = アガリ率 × 自分の打点 − 放銃率 × 相手の打点 − 相手のツモ率 × (1 − アガリ率) × ツモの支払い。降りの期待値 =
        − 相手のツモ率 × ツモの支払い。数値はよく知られた統計をもとにした目安です。
      </p>
      {q.waits.length > 0 && <p>自分の待ち: {q.waits.map((k) => tileName({ kind: k, red: false })).join('・')}</p>}
      <RiichiReveal situation={q.situation} />
      <p>{hit ? `実際には ${name} は当たり牌でした。` : `実際には ${name} は通る牌でした。`}(結果ではなく、確率で考えるのが大切です)</p>
    </div>
  )
}

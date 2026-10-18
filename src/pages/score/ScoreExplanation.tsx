import { Link } from '../../app/Link'
import { isKiriageMangan, LIMIT_LABELS, pointsFor } from '../../engine/scoring'
import { formatTsumo } from '../../engine/scoreTable'
import { expectedPoints, type ScoreAnswer, type ScoreQuestion } from '../../engine/scoreQuestion'
import { LimitTableView, ScoreTableView } from './ScoreTableView'

const f = (n: number) => n.toLocaleString('ja-JP')

function paymentText(q: ScoreQuestion): string {
  const p = q.result.payment
  if (p.type === 'ron') return `ロン ${f(p.fromDiscarder)}点`
  return `ツモ ${formatTsumo(p)}(合計 ${f(q.result.points)}点)`
}

function answerText(q: ScoreQuestion, a: ScoreAnswer): string {
  if ('yaku' in a) return a.yaku.length ? a.yaku.join('・') : '(選択なし)'
  if ('han' in a) return `${a.han}翻${a.fu}符`
  const expected = expectedPoints(q)
  return expected.length === 2 ? `${f(a.points[0])}/${f(a.points[1])}` : a.points.map(f).join('')
}

export function ScoreExplanation({ question, answer, correct }: { question: ScoreQuestion; answer: ScoreAnswer; correct: boolean }) {
  const r = question.result
  const dealer = question.context.seatWind === 1
  const kiriage = isKiriageMangan(r.han, r.fu)
  const limitByHan = r.limit !== null && !kiriage && r.han >= 5
  const level = question.data.level
  return (
    <>
      <p>
        正解:
        <strong>
          {level === 'beginner' && r.yaku.map((y) => y.name).join('・')}
          {level === 'intermediate' && `${r.han}翻${r.fu}符`}
          {level === 'advanced' && paymentText(question)}
        </strong>
      </p>
      {!correct && <p>あなたの回答:{answerText(question, answer)}</p>}
      <p>
        この手は <strong>{r.label}</strong>、{dealer ? '親' : '子'}の{paymentText(question)}です。
      </p>
      {kiriage && (
        <p className="score-kiriage-note">
          Mリーグルールでは切り上げ満貫あり:{r.fu}符{r.han}翻は本来 {f(Math.ceil((r.fu * 2 ** (r.han + 2) * (dealer ? 6 : 4)) / 100) * 100)}
          点ですが、満貫 {f(pointsFor(5, 30, dealer).ron)}点として扱います。
        </p>
      )}

      <h3 className="eff-heading">役と翻数</h3>
      <table className="score-breakdown">
        <tbody>
          {r.yaku.map((y) => (
            <tr key={y.name}>
              <th scope="row">{y.name}</th>
              <td>{y.han}翻</td>
            </tr>
          ))}
          {r.dora.map((d) => (
            <tr key={d.name} className="score-breakdown--dora">
              <th scope="row">{d.name}(役ではない)</th>
              <td>{d.han}翻</td>
            </tr>
          ))}
          <tr className="score-breakdown--total">
            <th scope="row">合計</th>
            <td>{r.han}翻</td>
          </tr>
        </tbody>
      </table>

      <h3 className="eff-heading">符の内訳</h3>
      <table className="score-breakdown">
        <tbody>
          {r.fuItems.map((item, i) => (
            <tr key={i}>
              <th scope="row">{item.label}</th>
              <td>{item.fu}符</td>
            </tr>
          ))}
          <tr className="score-breakdown--total">
            <th scope="row">合計</th>
            <td>
              {r.fuRaw === r.fu ? `${r.fu}符` : `${r.fuRaw}符 → 切り上げて${r.fu}符`}
            </td>
          </tr>
        </tbody>
      </table>
      {r.shape === 'chiitoitsu' && <p className="score-note">七対子は25符で固定です(切り上げません)。</p>}
      {limitByHan && <p className="score-note">5翻以上なので{LIMIT_LABELS[r.limit!]}です。符は点数に関係しません。</p>}

      <h3 className="eff-heading">点数表の該当箇所({dealer ? '親' : '子'})</h3>
      {r.limit === null || kiriage ? (
        <ScoreTableView dealer={dealer} fuRows={[r.fu]} highlight={{ fu: r.fu, han: r.han, tsumo: question.context.tsumo }} />
      ) : (
        <LimitTableView dealer={dealer} highlight={r.limit} />
      )}
      {r.limit === 'mangan' && !kiriage && r.han < 5 && (
        <p className="score-note">{r.fu}符{r.han}翻は基本点が2,000点以上になるので満貫です。</p>
      )}
      <p>
        <Link to="/score-table">点数早見表を見る</Link>
      </p>
    </>
  )
}

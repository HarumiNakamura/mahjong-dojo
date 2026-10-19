import { useEffect, useState } from 'react'
import type { Paipu } from '@kobalab/majiang-core'
import { Link } from '../../app/Link'
import { loadPaipuRecords } from '../../app/paipuStore'
import { useRecords } from '../../app/records/useRecords'
import { readQuery } from '../../app/router'
import { runReview } from '../../app/runReview'
import { Hand } from '../../components/tile/Hand'
import { efficiencyDrill } from '../../drills/efficiency'
import { addBookmarks, bookmarkId, gameRates, setGameReview, toggleFavorite, isFavorite, type GameRates, type GameRecord, type RecordsData } from '../../engine/records'
import { handView } from '../../game/convert'
import { difficultyLabel } from '../../game/difficulty'
import { boardAt, kyokuLabel, replayUrl } from '../../game/replay'
import { formatPoints } from '../../game/result'
import { efficiencyQuestionAt } from '../../review/efficiencyQuestionAt'
import { rankedCategories, summaryLine } from '../../review/summary'
import { CATEGORIES, CATEGORY_NAMES, type Finding, type GameReview } from '../../review/types'
import { REVIEW_LINKS } from './reviewLinks'
import './play.css'
import '../pages.css'

const yen = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}点`
const shortLabel = (paipu: Paipu, k: number) => kyokuLabel(paipu, k).replace(/ 0本場$/, '')

/** 振り返りを初めて開いたときに、学習記録へ保存する(まとめ・分かれ目の復習リスト・何切るの復習リスト) */
function saveReview(data: RecordsData, game: GameRecord, paipu: Paipu, review: GameReview): RecordsData {
  let d = setGameReview(data, game.id, { decisions: review.decisions, counts: { ...review.counts }, loss: review.totalLoss })
  const now = new Date().toISOString()
  d = addBookmarks(
    d,
    review.turningPoints.map((f) => ({
      id: bookmarkId(game.id, f.kyoku, f.step),
      gameId: game.id,
      kyoku: f.kyoku,
      step: f.step,
      title: `${shortLabel(paipu, f.kyoku)} ${f.title}`,
      source: 'auto' as const,
      addedAt: now,
    })),
  )
  // 打牌の分かれ目は、何切るドリルの復習リストにも入れる(解き直せるように)
  for (const f of review.turningPoints.filter((x) => x.category === 'discard')) {
    const q = efficiencyQuestionAt(paipu, f.kyoku, f.step)
    if (!q || isFavorite(d, efficiencyDrill.id, efficiencyDrill.keyOf(q))) continue
    d = toggleFavorite(d, { drill: efficiencyDrill.id, questionKey: efficiencyDrill.keyOf(q), question: efficiencyDrill.toData(q), addedAt: now })
  }
  return d
}

/** その場面の自分の手牌 */
function SceneHand({ paipu, f }: { paipu: Paipu; f: Pick<Finding, 'kyoku' | 'step'> }) {
  const board = boardAt(paipu, { kyoku: f.kyoku, step: f.step })
  const v = handView(board.shoupai[board.menfeng(0)].toString())
  return (
    <div className="review-hand">
      <Hand tiles={v.tiles} drawn={v.drawn} />
    </div>
  )
}

function FindingCard({ paipu, gameId, f, rank }: { paipu: Paipu; gameId: string; f: Finding; rank?: number }) {
  return (
    <article className="review-card">
      <p className="review-card-head">
        {rank !== undefined && <span className="review-rank">{rank}</span>}
        <span>{shortLabel(paipu, f.kyoku)}</span>
        <strong>{f.title}</strong>
        <span className="review-loss">約−{yen(f.loss)}</span>
      </p>
      <SceneHand paipu={paipu} f={f} />
      <dl className="review-dl">
        <div>
          <dt>あなた</dt>
          <dd>{f.played}</dd>
        </div>
        <div>
          <dt>よりよい選択</dt>
          <dd>{f.better}</dd>
        </div>
      </dl>
      <p className="review-reason">{f.reason}</p>
      <Link to={replayUrl(gameId, { kyoku: f.kyoku, step: f.step })} className="button button--block">
        牌譜でこの場面を見る
      </Link>
    </article>
  )
}

function RatesTable({ now, before }: { now: GameRates; before: GameRates }) {
  const pct = (v: number | null) => (v === null ? '—' : `${v}%`)
  const rows: { label: string; a: string; b: string }[] = [
    { label: 'アガリ率', a: pct(now.hule), b: pct(before.hule) },
    { label: '放銃率', a: pct(now.fangchong), b: pct(before.fangchong) },
    { label: '副露率', a: pct(now.fulou), b: pct(before.fulou) },
    { label: 'リーチ率', a: pct(now.lizhi), b: pct(before.lizhi) },
    { label: '平均打点', a: now.averageWin === null ? '—' : yen(now.averageWin), b: before.averageWin === null ? '—' : yen(before.averageWin) },
  ]
  return (
    <table className="play-result-table review-rates">
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">今回</th>
          <th scope="col">これまで{before.games ? `(${before.games}半荘)` : ''}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{r.a}</td>
            <td>{before.games ? r.b : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** CPU対戦の振り返り(/play/review?g=<対局>) */
export function GameReviewPage() {
  const [gameId] = useState(() => readQuery().get('g'))
  const [record] = useState(() => loadPaipuRecords().find((r) => r.id === gameId) ?? null)
  const { data, update } = useRecords()
  const [review, setReview] = useState<GameReview | null>(null)
  const [error, setError] = useState(false)
  const game = data.games.find((g) => g.id === gameId)

  useEffect(() => {
    if (!record) return
    let alive = true
    runReview(record.paipu).then(
      (r) => {
        if (!alive) return
        setReview(r)
        update((d) => {
          const g = d.games.find((x) => x.id === record.id)
          return g && !g.review ? saveReview(d, g, record.paipu, r) : d
        })
      },
      () => alive && setError(true),
    )
    return () => {
      alive = false
    }
  }, [record, update])

  if (!record) {
    return (
      <>
        <h1 className="page-title">CPU対戦の振り返り</h1>
        <p>この対局の牌譜が見つかりませんでした。牌譜はこの端末のブラウザに、新しい20半荘まで保存されます。</p>
        <p>
          <Link to="/play/replay">保存している牌譜の一覧</Link>
        </p>
      </>
    )
  }

  const paipu = record.paipu
  const marks = data.bookmarks.filter((b) => b.gameId === record.id && b.source === 'marker')
  // 比べるのは同じモード(練習モードかどうか)の対局
  const others = data.games.filter((g) => g.id !== record.id && Boolean(g.practice) === Boolean(game?.practice))
  const cats = review ? rankedCategories(review) : []

  return (
    <div className="review">
      <h1 className="page-title">CPU対戦の振り返り</h1>
      <p className="review-result">
        {paipu.rank[0]}位 {paipu.defen[0].toLocaleString('ja-JP')}点
        {game && `(${formatPoints(game.points10)})`}
        {game && ` CPU:${difficultyLabel(game.cpu)}${game.practice ? '・練習モード' : ''}`}
      </p>
      <p className="review-note">
        判定は、統計をもとにした<strong>目安</strong>です。麻雀は運の要素が大きいので、結果ではなく「その場面で見えていた情報で、平均的に得だったか」で見ています。損失の点数も概算です。
      </p>

      {error && <p className="review-error">振り返りの計算に失敗しました。ページを開き直してください。</p>}
      {!review && !error && <p className="page-loading">振り返りを計算しています…</p>}

      {review && (
        <>
          <p className="review-summary">{summaryLine(review, (k) => kyokuLabel(paipu, k))}</p>

          <section className="review-section">
            <h2>分かれ目</h2>
            {review.turningPoints.length === 0 ? (
              <p>大きな分かれ目はありませんでした。</p>
            ) : (
              <>
                <p className="review-note">損失の目安が大きい順です。学習記録の「CPU対戦の復習リスト」にも入れました(打牌の場面は何切るの復習リストにも)。</p>
                {review.turningPoints.map((f, i) => (
                  <FindingCard key={`${f.kyoku}-${f.step}-${f.kind}`} paipu={paipu} gameId={record.id} f={f} rank={i + 1} />
                ))}
              </>
            )}
          </section>

          {marks.length > 0 && (
            <section className="review-section">
              <h2>後で見ると印をつけた場面</h2>
              {marks.map((m) => {
                const found = review.findings.filter((f) => f.kyoku === m.kyoku && f.step === m.step)
                return found.length ? (
                  found.map((f) => <FindingCard key={`${m.id}-${f.kind}`} paipu={paipu} gameId={record.id} f={f} />)
                ) : (
                  <article key={m.id} className="review-card">
                    <p className="review-card-head">
                      <span>{shortLabel(paipu, m.kyoku)}</span>
                      <strong>{m.step}手目</strong>
                    </p>
                    <SceneHand paipu={paipu} f={m} />
                    <p className="review-reason">この場面では、気になる判断は見つかりませんでした。</p>
                    <Link to={replayUrl(record.id, { kyoku: m.kyoku, step: m.step })} className="button button--block">
                      牌譜でこの場面を見る
                    </Link>
                  </article>
                )
              })}
            </section>
          )}

          <section className="review-section">
            <h2>分類ごとの指摘</h2>
            <table className="play-result-table review-counts">
              <tbody>
                {CATEGORIES.map((c) => (
                  <tr key={c}>
                    <td>{CATEGORY_NAMES[c]}</td>
                    <td>{review.counts[c]}回</td>
                    <td>
                      <Link to={REVIEW_LINKS[c].drill.path}>練習する</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="review-note">調べた打牌 {review.decisions}回</p>
            {review.findings.length > 0 && (
              <details className="review-all">
                <summary>すべての指摘({review.findings.length}件)</summary>
                <ul>
                  {review.findings.map((f, i) => (
                    <li key={i}>
                      <Link to={replayUrl(record.id, { kyoku: f.kyoku, step: f.step })}>
                        {shortLabel(paipu, f.kyoku)} {f.title}
                      </Link>
                      :{f.played}(約−{yen(f.loss)})
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {game && (
            <section className="review-section">
              <h2>今回の成績とこれまで</h2>
              <RatesTable now={gameRates([game])} before={gameRates(others)} />
            </section>
          )}

          <section className="review-section">
            <h2>関連する練習と解説</h2>
            <ul className="review-links">
              {(cats.length ? cats.slice(0, 2) : (['discard', 'pushfold'] as const)).map((c) => (
                <li key={c}>
                  <strong>{CATEGORY_NAMES[c]}</strong>:<Link to={REVIEW_LINKS[c].drill.path}>{REVIEW_LINKS[c].drill.label}</Link>
                  {REVIEW_LINKS[c].articles.map((a) => (
                    <span key={a.path}>
                      ・<Link to={a.path}>{a.label}</Link>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="review-footer">
        <Link to={replayUrl(record.id)} className="button button--block">
          牌譜を見る
        </Link>
        <Link to="/play" className="button button--primary button--block">
          もう一度対局する
        </Link>
      </div>
    </div>
  )
}

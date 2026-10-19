import { Link } from '../../app/Link'
import { useRecords } from '../../app/records/useRecords'
import { gameRates, gameSummary, type GameRecord } from '../../engine/records'
import { DIFFICULTIES, difficultyLabel } from '../../game/difficulty'
import { replayUrl, reviewUrl } from '../../game/replay'
import { formatPoints } from '../../game/result'
import './play.css'
import '../pages.css'

const pct = (v: number | null) => (v === null ? '—' : `${v}%`)

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 難易度ごと(と練習モード)の通算成績 */
function StatsCard({ title, games }: { title: string; games: readonly GameRecord[] }) {
  const s = gameSummary(games)
  const r = gameRates(games)
  const ranks = [1, 2, 3, 4].map((n) => games.filter((g) => g.rank === n).length)
  const recent = games.slice(-10)
  const recentAvg = recent.length ? (recent.reduce((a, g) => a + g.rank, 0) / recent.length).toFixed(2) : null
  const reviewed = games.filter((g) => g.review)
  const findings = reviewed.length ? (reviewed.reduce((a, g) => a + Object.values(g.review!.counts).reduce((x, y) => x + y, 0), 0) / reviewed.length).toFixed(1) : null
  return (
    <section className="review-card stats-card">
      <h2 className="stats-title">
        {title}
        <span className="stats-count">{s.games}半荘</span>
      </h2>
      <dl className="stats-grid">
        <div>
          <dt>平均順位</dt>
          <dd>{s.averageRank === null ? '—' : `${s.averageRank.toFixed(2)}位`}</dd>
        </div>
        <div>
          <dt>最近10半荘</dt>
          <dd>{recentAvg === null ? '—' : `${recentAvg}位`}</dd>
        </div>
        <div>
          <dt>合計ポイント</dt>
          <dd>{formatPoints(s.totalPoints10)}</dd>
        </div>
        <div>
          <dt>平均ポイント</dt>
          <dd>{s.games ? formatPoints(Math.round(s.totalPoints10 / s.games)) : '—'}</dd>
        </div>
        <div>
          <dt>アガリ率</dt>
          <dd>{pct(r.hule)}</dd>
        </div>
        <div>
          <dt>放銃率</dt>
          <dd>{pct(r.fangchong)}</dd>
        </div>
        <div>
          <dt>副露率</dt>
          <dd>{pct(r.fulou)}</dd>
        </div>
        <div>
          <dt>リーチ率</dt>
          <dd>{pct(r.lizhi)}</dd>
        </div>
        <div>
          <dt>平均打点</dt>
          <dd>{r.averageWin === null ? '—' : `${r.averageWin.toLocaleString('ja-JP')}点`}</dd>
        </div>
        <div>
          <dt>振り返りの指摘</dt>
          <dd>{findings === null ? '—' : `${findings}回/半荘`}</dd>
        </div>
      </dl>
      <div className="stats-ranks" role="img" aria-label={`順位の割合: ${ranks.map((n, i) => `${i + 1}位 ${n}回`).join('、')}`}>
        {ranks.map((n, i) =>
          n ? (
            <span key={i} className={`stats-rank stats-rank--${i + 1}`} style={{ flexGrow: n }}>
              {i + 1}位 {Math.round((n / s.games) * 100)}%
            </span>
          ) : null,
        )}
      </div>
    </section>
  )
}

/** CPU対戦の通算成績(/play/stats) */
export function PlayStatsPage() {
  const { data } = useRecords()
  const normal = data.games.filter((g) => !g.practice)
  const practice = data.games.filter((g) => g.practice)
  const groups = DIFFICULTIES.map((d) => ({ d, games: normal.filter((g) => g.cpu === d.id || (d.id === 'strong' && g.cpu === 'latest')) })).filter((x) => x.games.length)
  const recent = data.games.slice(-10).reverse()

  return (
    <div className="review">
      <h1 className="page-title">CPU対戦の成績</h1>
      {data.games.length === 0 ? (
        <p>
          まだ対局の記録がありません。<Link to="/play">CPU対戦</Link>で半荘を打ち終えると、ここに成績が出ます。
        </p>
      ) : (
        <>
          <p className="review-note">成績はこの端末のブラウザに保存しています(学習記録の書き出しで、ほかの端末に移せます)。練習モードの対局は分けて集計します。</p>
          {normal.length > 0 && <StatsCard title="すべての対局(練習モードを除く)" games={normal} />}
          {groups.length > 1 && groups.map(({ d, games }) => <StatsCard key={d.id} title={`CPU:${d.label}`} games={games} />)}
          {practice.length > 0 && <StatsCard title="練習モード" games={practice} />}

          <section className="review-section">
            <h2>最近の対局</h2>
            <ul className="review-links">
              {recent.map((g) => (
                <li key={g.id}>
                  {formatDate(g.playedAt)} {difficultyLabel(g.cpu)}
                  {g.practice ? '(練習)' : ''} {g.rank}位 {g.score.toLocaleString('ja-JP')}点({formatPoints(g.points10)}) <Link to={reviewUrl(g.id)}>振り返り</Link>{' '}
                  <Link to={replayUrl(g.id)}>牌譜</Link>
                </li>
              ))}
            </ul>
            <p className="review-note">牌譜と振り返りは、新しい20半荘まで見られます。</p>
          </section>
        </>
      )}
      <Link to="/play" className="button button--primary button--block">
        CPU対戦をする
      </Link>
    </div>
  )
}

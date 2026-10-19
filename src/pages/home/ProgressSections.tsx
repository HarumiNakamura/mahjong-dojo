import { useState } from 'react'
import { Link } from '../../app/Link'
import { useRecords } from '../../app/records/useRecords'
import { areaStats, countDailyDone, gameAreaStats, MIN_ANSWERS, recommend, REVIEW_CATEGORY_AREAS, roadmapProgress, streakDays } from '../../engine/progress'
import { localDate } from '../../engine/records'
import { loadDailyKeys } from '../../app/dailyCache'

const STATUS_LABELS = { notStarted: '未着手', inProgress: '練習中', cleared: 'クリア' } as const

/** ホームの「今日の練習」「ロードマップ」「弱点マップ」。すべて学習記録から計算する */
export function ProgressSections() {
  const { data } = useRecords()
  const [now] = useState(() => new Date())
  const date = localDate(now)
  // 今日の練習のキーは「今日の練習」ページが保存する。なければ今日はまだ0問
  const [dailyKeys] = useState(() => loadDailyKeys(date))
  const attempts = data.attempts
  const streak = streakDays(attempts, now)
  const done = dailyKeys ? countDailyDone(dailyKeys, attempts, date) : 0
  const roadmap = roadmapProgress(attempts)
  const nextStep = roadmap.findIndex((p) => p.status !== 'cleared')
  const stats = areaStats(attempts)
  const rec = recommend(attempts, data.games)
  const gameStats = gameAreaStats(data.games)
  const reviewedGames = gameStats[0]?.games ?? 0
  const hasGameCategory = (areaId: string) => Object.values(REVIEW_CATEGORY_AREAS).includes(areaId)

  return (
    <>
      <section className="home-section">
        <h2>今日の練習</h2>
        <div className="today-card">
          <p className="today-card-text">
            毎日入れ替わる5問です。
            今日は <strong>{done} / 5 問</strong>
            {done >= 5 ? '(完了!)' : ''}。
          </p>
          <p className="today-card-streak">
            連続 <strong>{streak}</strong> 日
          </p>
          <Link to="/today" className="button button--primary button--block">
            {done >= 5 ? 'もう一度解く' : '今日の5問を解く'}
          </Link>
        </div>
      </section>

      <section className="home-section">
        <h2>学習ロードマップ</h2>
        <ol className="roadmap">
          {roadmap.map((p, i) => (
            <li
              key={p.step.id}
              className={`roadmap-step roadmap-step--${p.status}${i === nextStep ? ' roadmap-step--next' : ''}`}
            >
              <Link to={p.step.path} className="roadmap-link">
                <span className="roadmap-num" aria-hidden="true">
                  {p.status === 'cleared' ? '✓' : i + 1}
                </span>
                <span className="roadmap-body">
                  <span className="roadmap-title">
                    {p.step.label}
                    <span className="roadmap-status">{i === nextStep ? '次はここ' : STATUS_LABELS[p.status]}</span>
                  </span>
                  <span className="roadmap-text">{p.step.description}</span>
                  <span className="roadmap-bar" role="img" aria-label={`進み具合 ${p.percent}%`}>
                    <span className="roadmap-bar-fill" style={{ width: `${p.percent}%` }} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="home-note">各分野で20問以上・正解率70%以上になるとクリアです。</p>
      </section>

      <section className="home-section">
        <h2>弱点マップ</h2>
        <p className="home-note">
          分野ごとの正解率(最近の50問まで)。記録が{MIN_ANSWERS}問未満の分野は薄く表示します。
          {reviewedGames > 0 && `CPU対戦は、振り返りをした最近${reviewedGames}半荘の1半荘あたりの指摘の数です。`}
        </p>
        <ul className="weak-map">
          {stats.map((s) => (
            <li key={s.area.id} className={`weak-row${s.answered < MIN_ANSWERS ? ' weak-row--few' : ''}`}>
              <span className="weak-label">{s.area.label}</span>
              <span className="weak-bar" aria-hidden="true">
                <span className="weak-bar-fill" style={{ width: `${s.rate ?? 0}%` }} />
              </span>
              <span className="weak-value">{s.rate === null ? '—' : `${s.rate}%`}</span>
              <span className="weak-count">{s.answered}問</span>
              {reviewedGames > 0 && hasGameCategory(s.area.id) && (
                <span className="weak-game">CPU対戦の指摘 {gameStats.find((g) => g.area.id === s.area.id)?.perGame ?? 0}回/半荘</span>
              )}
            </li>
          ))}
        </ul>
        <div className="weak-rec">
          <p>
            次のおすすめ: <strong>{rec.area.label}</strong>
          </p>
          <p className="home-note">{rec.reason}</p>
          <Link to={rec.area.path} className="button button--block">
            {rec.area.label}を練習する
          </Link>
        </div>
      </section>
    </>
  )
}

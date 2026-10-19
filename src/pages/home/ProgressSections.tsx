import { useState } from 'react'
import { Link } from '../../app/Link'
import { useRecords } from '../../app/records/useRecords'
import { areaStats, countDailyDone, gameAreaStats, MIN_ANSWERS, recommend, REVIEW_CATEGORY_AREAS, roadmapProgress, streakDays } from '../../engine/progress'
import { localDate } from '../../engine/records'
import { loadDailyKeys } from '../../app/dailyCache'
import { FirstSteps } from './FirstSteps'
import { RoadmapPath } from './RoadmapPath'

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
  const roadmap = roadmapProgress(attempts, data.games)
  const stats = areaStats(attempts)
  const rec = recommend(attempts, data.games)
  const gameStats = gameAreaStats(data.games)
  const reviewedGames = gameStats[0]?.games ?? 0
  const hasGameCategory = (areaId: string) => Object.values(REVIEW_CATEGORY_AREAS).includes(areaId)

  // 記録がない初めての人には、今日の練習・弱点マップのかわりに3ステップを出す
  if (attempts.length === 0 && data.games.length === 0) {
    return (
      <>
        <FirstSteps />
        <section className="home-section">
          <h2>学習ロードマップ</h2>
          <RoadmapPath steps={roadmap} />
        </section>
      </>
    )
  }

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
        <RoadmapPath steps={roadmap} />
        <p className="home-note">各分野で20問以上・正解率70%以上になるとクリアです。CPU対戦は3半荘打つとクリアです(練習モードを除く)。</p>
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

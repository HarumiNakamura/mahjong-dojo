import type { DailyStats } from '../../engine/records'

const weekday = ['日', '月', '火', '水', '木', '金', '土']

function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${m}/${d}(${weekday[new Date(y, m - 1, d).getDay()]})`
}

/** 最近7日の正解率の推移(棒の高さ = 正解率、下に解いた数) */
export function TrendChart({ days }: { days: readonly DailyStats[] }) {
  return (
    <figure className="trend">
      <figcaption className="trend-caption">最近7日の正解率</figcaption>
      <div className="trend-chart" aria-hidden="true">
        {days.map((d) => {
          const tip = d.answered ? `${dayLabel(d.date)} ${d.answered}問中${d.correct}問正解(${d.rate}%)` : `${dayLabel(d.date)} 記録なし`
          return (
            <div key={d.date} className="trend-col" title={tip}>
              <span className="trend-value">{d.rate === null ? '' : `${d.rate}%`}</span>
              <div className="trend-track">
                {d.rate !== null && <div className="trend-bar" style={{ height: `${Math.max(d.rate, 2)}%` }} />}
              </div>
              <span className="trend-day">{dayLabel(d.date).replace(/\(.\)/, '')}</span>
              <span className="trend-count">{d.answered ? `${d.answered}問` : '-'}</span>
            </div>
          )
        })}
      </div>
      <table className="visually-hidden">
        <caption>最近7日の記録</caption>
        <thead>
          <tr>
            <th scope="col">日付</th>
            <th scope="col">解いた数</th>
            <th scope="col">正解率</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{dayLabel(d.date)}</td>
              <td>{d.answered}問</td>
              <td>{d.rate === null ? '記録なし' : `${d.rate}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

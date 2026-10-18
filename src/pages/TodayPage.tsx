import { useCallback, useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { useRecords } from '../app/records/useRecords'
import { Drill, type DrillResult } from '../components/drill/Drill'
import { dailyDoneCount, dailyItems, type DailyItem } from '../drills/daily'
import { streakDays } from '../engine/progress'
import { addAttempt, localDate } from '../engine/records'
import './defense/defense.css'
import './efficiency/efficiency.css'
import './judgment/judgment.css'
import './records/records.css'
import './score/score.css'
import './waits/waits.css'
import './pages.css'

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** 今日の練習: 日付で決まる5問を、いろいろなドリルから1問ずつ解く */
export function TodayPage() {
  const [now] = useState(() => new Date())
  const date = localDate(now)
  const [items] = useState(() => dailyItems(date))
  const { data, update } = useRecords()
  const done = dailyDoneCount(items, data.attempts, date)
  const streak = streakDays(data.attempts, now)

  const onResult = useCallback(
    ({ question, answer, correct }: DrillResult<DailyItem, unknown>) => {
      update((d) =>
        addAttempt(d, {
          id: newId(),
          drill: question.definition.id,
          questionKey: question.key,
          question: question.definition.toData(question.question),
          answer,
          correct,
          answeredAt: new Date().toISOString(),
        }),
      )
    },
    [update],
  )

  return (
    <>
      <h1 className="page-title">今日の練習</h1>
      <p className="page-lead">
        {date.replaceAll('-', '/')} の5問です(毎日入れ替わります)。いろいろな分野から1問ずつ出題します。
      </p>
      <p className="today-status">
        今日 {done} / {items.length} 問・連続 {streak} 日
      </p>
      <Drill<DailyItem, unknown>
        totalQuestions={items.length}
        makeQuestion={(i) => items[i % items.length]}
        judge={(item, a) => item.definition.judge(item.question, a)}
        renderQuestion={(props) => (
          <>
            <p className="today-drill">
              <span className="badge">{props.question.definition.title}</span>
            </p>
            {props.question.definition.renderQuestion({ ...props, question: props.question.question })}
          </>
        )}
        renderExplanation={(r) => r.question.definition.renderExplanation({ ...r, question: r.question.question })}
        onResult={onResult}
      />
      <div className="link-row">
        <Link to="/" className="button">
          ホームへ
        </Link>
        <Link to="/records" className="button">
          学習記録へ
        </Link>
      </div>
      <StorageNotice compact />
    </>
  )
}

import { useMemo, useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { planDrill } from '../drills/plan'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import type { PlanId } from '../engine/plan'
import { generatePlanQuestion, type PlanQuestion } from '../engine/planQuestion'
import { createRng } from '../engine/random'
import './defense/defense.css'
import './efficiency/efficiency.css'
import './judgment/judgment.css'
import './records/records.css'
import './pages.css'

const QUESTIONS_PER_SET = 10

export function PlanPage() {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite, share } = useDrillRecorder(planDrill)
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">配牌方針クイズ</h1>
        <Link to="/practice/judgment" className="button eff-change">
          判断の練習へ
        </Link>
      </div>
      <p className="page-lead">
        配牌を見て、どんな手を目指すかを決めましょう。答えたあと、同じ配牌で一人麻雀を続けることもできます。
      </p>
      <Drill<PlanQuestion, PlanId>
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generatePlanQuestion(rng)}
        judge={planDrill.judge}
        renderQuestion={planDrill.renderQuestion}
        renderExplanation={planDrill.renderExplanation}
        onResult={onResult}
        favorite={favorite}
        share={share}
      />
      <StorageNotice compact />
    </>
  )
}

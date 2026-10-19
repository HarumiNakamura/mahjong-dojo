import { useMemo, useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { callDrill } from '../drills/call'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import type { CallAnswer } from '../engine/call'
import { generateCallQuestion, type CallQuestion } from '../engine/callQuestion'
import { createRng } from '../engine/random'
import './defense/defense.css'
import './efficiency/efficiency.css'
import './judgment/judgment.css'
import './records/records.css'
import './pages.css'

const QUESTIONS_PER_SET = 10

export function CallPage() {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite, share } = useDrillRecorder(callDrill)
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">鳴き判断クイズ</h1>
        <Link to="/practice/judgment" className="button eff-change">
          判断の練習へ
        </Link>
      </div>
      <p className="page-lead">
        他の人の捨て牌をポン・チーするか、スルーするかを選びます。鳴くときは、鳴いたあとに切る牌も選びましょう。
      </p>
      <Drill<CallQuestion, CallAnswer>
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generateCallQuestion(rng)}
        judge={callDrill.judge}
        renderQuestion={callDrill.renderQuestion}
        renderExplanation={callDrill.renderExplanation}
        onResult={onResult}
        favorite={favorite}
        share={share}
      />
      <StorageNotice compact />
    </>
  )
}

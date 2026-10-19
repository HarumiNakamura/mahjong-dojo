import { useMemo, useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { pushFoldDrill } from '../drills/pushfold'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import { generatePushFoldQuestion, type PushFoldAnswer, type PushFoldQuestion } from '../engine/pushfoldQuestion'
import { createRng } from '../engine/random'
import './defense/defense.css'
import './efficiency/efficiency.css'
import './judgment/judgment.css'
import './records/records.css'
import './pages.css'

const QUESTIONS_PER_SET = 10

export function PushFoldPage() {
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite, share } = useDrillRecorder(pushFoldDrill)
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">押し引きジャッジ</h1>
        <Link to="/practice/judgment" className="button eff-change">
          判断の練習へ
        </Link>
      </div>
      <p className="page-lead">
        相手がリーチ。自分の手を進めるには危険な牌を切るしかありません。押すか降りるかを選びましょう。差が小さいときはどちらも正解です。
      </p>
      <Drill<PushFoldQuestion, PushFoldAnswer>
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generatePushFoldQuestion(rng)}
        judge={pushFoldDrill.judge}
        renderQuestion={pushFoldDrill.renderQuestion}
        renderExplanation={pushFoldDrill.renderExplanation}
        onResult={onResult}
        favorite={favorite}
        share={share}
      />
      <StorageNotice compact />
    </>
  )
}

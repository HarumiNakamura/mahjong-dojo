import { useState } from 'react'
import { Link } from '../../app/Link'
import { StorageNotice } from '../../app/records/StorageNotice'
import { useRecords } from '../../app/records/useRecords'
import { Drill } from '../../components/drill/Drill'
import { findDrill } from '../../drills/registry'
import type { AnyDrillDefinition } from '../../drills/types'
import { useDrillRecorder } from '../../drills/useDrillRecorder'
import { mistakes } from '../../engine/records'
import { createRng, shuffle } from '../../engine/random'
import './records.css'
import '../pages.css'

export type ReviewMode = 'mistakes' | 'favorites'

const MODE_LABEL: Record<ReviewMode, string> = { mistakes: '間違えた問題の解き直し', favorites: 'お気に入りの問題' }

/** 間違えた問題・お気に入りの問題をランダム順に解き直す */
export function ReviewPage({ drillId, mode }: { drillId: string; mode: ReviewMode }) {
  const drill = findDrill(drillId)
  if (!drill) {
    return (
      <>
        <h1 className="page-title">解き直し</h1>
        <p>このドリルの記録は見つかりませんでした。</p>
        <Link to="/records" className="button">
          学習記録へ
        </Link>
      </>
    )
  }
  return <Review drill={drill} mode={mode} />
}

function Review({ drill, mode }: { drill: AnyDrillDefinition; mode: ReviewMode }) {
  const { data } = useRecords()
  const { onResult, favorite, share } = useDrillRecorder(drill)
  // 始めた時点の問題を、ランダム順に固定する(解いている途中で一覧が変わらないように)
  const [questions] = useState(() => {
    const source = mode === 'mistakes' ? mistakes(data, drill.id).map((a) => a.question) : data.favorites.filter((f) => f.drill === drill.id).map((f) => f.question)
    const restored = source.flatMap((q) => {
      try {
        return [drill.fromData(q)]
      } catch {
        return []
      }
    })
    return shuffle(restored, createRng(Math.floor(Math.random() * 2 ** 31)))
  })

  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">
          {drill.title}:{MODE_LABEL[mode]}
        </h1>
      </div>
      {questions.length === 0 ? (
        <>
          <p>{mode === 'mistakes' ? '間違えた問題はありません。' : 'お気に入りの問題はありません。'}</p>
          <div className="link-row">
            <Link to={drill.path} className="button button--primary">
              練習する
            </Link>
            <Link to="/records" className="button">
              学習記録へ
            </Link>
          </div>
        </>
      ) : (
        <>
          <Drill
            totalQuestions={questions.length}
            makeQuestion={(i) => questions[i]}
            judge={drill.judge}
            renderQuestion={drill.renderQuestion}
            renderExplanation={drill.renderExplanation}
            onResult={onResult}
            favorite={favorite}
            share={share}
          />
          <div className="link-row">
            <Link to="/records" className="button">
              学習記録へ戻る
            </Link>
          </div>
          <StorageNotice compact />
        </>
      )}
    </>
  )
}

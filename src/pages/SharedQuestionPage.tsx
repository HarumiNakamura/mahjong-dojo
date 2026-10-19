import { useState } from 'react'
import { Link } from '../app/Link'
import { readQuery } from '../app/router'
import { StorageNotice } from '../app/records/StorageNotice'
import { decodeShareData } from '../app/share'
import { Drill } from '../components/drill/Drill'
import { findDrill } from '../drills/registry'
import type { AnyDrillDefinition } from '../drills/types'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import './defense/defense.css'
import './efficiency/efficiency.css'
import './judgment/judgment.css'
import './records/records.css'
import './score/score.css'
import './solo/solo.css'
import './waits/waits.css'
import './pages.css'

/** URL の ?d= から問題を作り直す(できなければ null) */
function loadQuestion(definition: AnyDrillDefinition): unknown | null {
  const d = readQuery().get('d')
  if (!d) return null
  try {
    return definition.fromData(decodeShareData(d))
  } catch {
    return null
  }
}

function SharedDrill({ definition }: { definition: AnyDrillDefinition }) {
  const [question] = useState(() => loadQuestion(definition))
  const { onResult, favorite, share } = useDrillRecorder(definition)
  if (question === null) {
    return (
      <div className="notice">
        <p className="notice-title">問題を読み込めませんでした</p>
        <p>共有された URL が途中で切れているか、形が正しくない可能性があります。</p>
      </div>
    )
  }
  return (
    <Drill<unknown, unknown>
      totalQuestions={1}
      makeQuestion={() => question}
      judge={definition.judge}
      renderQuestion={definition.renderQuestion}
      renderExplanation={definition.renderExplanation}
      onResult={onResult}
      favorite={favorite}
      share={share}
    />
  )
}

/** 共有された問題のページ(/q/<ドリル>?d=…) */
export function SharedQuestionPage({ drillId }: { drillId: string }) {
  const definition = findDrill(drillId)
  return (
    <>
      <h1 className="page-title">共有された問題{definition ? `:${definition.title}` : ''}</h1>
      {definition ? (
        <>
          <p className="page-lead">友だちから共有された問題です。答えると解説が見られます。</p>
          <SharedDrill definition={definition} />
          <div className="link-row">
            <Link to={definition.path} className="button button--primary">
              {definition.title}をもっと解く
            </Link>
            <Link to="/" className="button">
              ホームへ
            </Link>
          </div>
        </>
      ) : (
        <div className="notice">
          <p className="notice-title">この問題は見つかりませんでした</p>
          <p>ドリルの種類が正しくありません。</p>
        </div>
      )}
      <StorageNotice compact />
    </>
  )
}

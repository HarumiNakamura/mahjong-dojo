import { useMemo, useState } from 'react'
import { Link } from '../app/Link'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { scoreDrill } from '../drills/score'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import { createRng } from '../engine/random'
import { generateScoreQuestion, SCORE_LEVELS, type ScoreAnswer, type ScoreLevel, type ScoreQuestion } from '../engine/scoreQuestion'
import './efficiency/efficiency.css'
import './score/score.css'
import './pages.css'

const QUESTIONS_PER_SET = 10

export function ScoreDrillPage() {
  const [level, setLevel] = useState<ScoreLevel | null>(null)
  const [seed, setSeed] = useState(0)
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite } = useDrillRecorder(scoreDrill)

  if (level === null) {
    return (
      <>
        <h1 className="page-title">点数計算</h1>
        <p className="page-lead">アガった手を見て、役・翻と符・点数を順に答えられるようになりましょう。1セット{QUESTIONS_PER_SET}問です。</p>
        <h2 className="eff-heading">段階を選んでください</h2>
        <ul className="card-list">
          {SCORE_LEVELS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                className="card card--button"
                onClick={() => {
                  setLevel(l.id)
                  setSeed(Math.floor(Math.random() * 2 ** 31))
                }}
              >
                <span className="card-title">{l.label}</span>
                <span className="card-text">{l.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="eff-howto">
          <h2 className="eff-heading">計算の流れ</h2>
          <ol>
            <li>成立している役を数えて翻数を出す(ドラは役ではないが翻数に加える)</li>
            <li>符を数える(副底20符に、門前ロン・ツモ・面子・雀頭・待ちの符を足して10符単位に切り上げ)</li>
            <li>翻と符を点数表に当てはめる(親は子の1.5倍)</li>
          </ol>
          <p>
            ルールは Mリーグ公式ルールです(切り上げ満貫あり・数え役満なし)。<Link to="/score-table">点数早見表</Link>も使えます。
          </p>
        </div>
        <StorageNotice />
      </>
    )
  }

  const label = SCORE_LEVELS.find((l) => l.id === level)?.label
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">点数計算({label})</h1>
        <button type="button" className="button eff-change" onClick={() => setLevel(null)}>
          段階を変える
        </button>
      </div>
      <Drill<ScoreQuestion, ScoreAnswer>
        key={`${level}-${seed}`}
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generateScoreQuestion(level, rng)}
        judge={scoreDrill.judge}
        renderQuestion={scoreDrill.renderQuestion}
        renderExplanation={scoreDrill.renderExplanation}
        onResult={onResult}
        favorite={favorite}
      />
      <StorageNotice compact />
    </>
  )
}

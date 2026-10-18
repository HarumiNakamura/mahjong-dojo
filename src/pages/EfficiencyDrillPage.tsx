import { useState } from 'react'
import { Drill } from '../components/drill/Drill'
import { isCorrectDiscard } from '../engine/efficiency'
import { DIFFICULTIES, generateQuestion, type Difficulty, type EfficiencyQuestion } from '../engine/efficiencyQuestion'
import { createRng } from '../engine/random'
import { EfficiencyExplanation } from './efficiency/EfficiencyExplanation'
import { EfficiencyQuestionView } from './efficiency/EfficiencyQuestionView'
import './efficiency/efficiency.css'
import './pages.css'

const QUESTIONS_PER_SET = 10

export function EfficiencyDrillPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  // 難易度を選ぶたびに新しい乱数で問題を作る
  const [seed, setSeed] = useState(0)

  if (difficulty === null) {
    return (
      <>
        <h1 className="page-title">何切る(牌効率)</h1>
        <p className="page-lead">
          14枚の手牌から1枚切るとき、どれを切ると早くテンパイに近づくかを考えます。1セット{QUESTIONS_PER_SET}問です。
        </p>
        <h2 className="eff-heading">難易度を選んでください</h2>
        <ul className="card-list">
          {DIFFICULTIES.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="card card--button"
                onClick={() => {
                  setDifficulty(d.id)
                  setSeed(Math.floor(Math.random() * 2 ** 31))
                }}
              >
                <span className="card-title">{d.label}</span>
                <span className="card-text">{d.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="eff-howto">
          <h2 className="eff-heading">考え方</h2>
          <ul>
            <li>まずシャンテン数(あと何枚でテンパイか)が進む打牌を選びます。</li>
            <li>同じシャンテン数なら、引いたときに進む牌(有効牌)が多く残っている打牌が有利です。これを受け入れ枚数といいます。</li>
            <li>受け入れ枚数は、自分の手牌・河・ドラ表示牌など、見えている牌を差し引いて数えます。</li>
          </ul>
        </div>
      </>
    )
  }

  const rng = createRng(seed)
  const label = DIFFICULTIES.find((d) => d.id === difficulty)?.label
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">何切る({label})</h1>
        <button type="button" className="button eff-change" onClick={() => setDifficulty(null)}>
          難易度を変える
        </button>
      </div>
      <Drill<EfficiencyQuestion, number>
        key={`${difficulty}-${seed}`}
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generateQuestion(difficulty, rng)}
        judge={(q, kind) => isCorrectDiscard(q.judgement, kind)}
        renderQuestion={(props) => <EfficiencyQuestionView key={props.index} {...props} />}
        renderExplanation={({ question, answer }) => <EfficiencyExplanation question={question} answer={answer} />}
      />
    </>
  )
}

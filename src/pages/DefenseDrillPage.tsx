import { useMemo, useState } from 'react'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { safetyDrill } from '../drills/safety'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import { createRng } from '../engine/random'
import {
  generateSafetyQuestion,
  SAFETY_LEVELS,
  type SafetyAnswer,
  type SafetyLevel,
  type SafetyMode,
  type SafetyQuestion,
} from '../engine/safetyQuestion'
import './defense/defense.css'
import './efficiency/efficiency.css'
import './records/records.css'
import './waits/waits.css'
import './pages.css'

const QUESTIONS_PER_SET = 5

export function DefenseDrillPage() {
  const [mode, setMode] = useState<SafetyMode>('order')
  const [level, setLevel] = useState<SafetyLevel | null>(null)
  const [seed, setSeed] = useState(0)
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite } = useDrillRecorder(safetyDrill)

  if (level === null) {
    return (
      <>
        <h1 className="page-title">安パイ並べ</h1>
        <p className="page-lead">
          相手がリーチしています。自分の手牌14枚を、安全な順に並べましょう。終わると、牌ごとの根拠(現物・スジ・壁など)と危険度の目安が見られます。
        </p>
        <div className="waits-modes" role="group" aria-label="モード">
          <button type="button" className="waits-mode" aria-pressed={mode === 'order'} onClick={() => setMode('order')}>
            14枚を並べる
          </button>
          <button type="button" className="waits-mode" aria-pressed={mode === 'pick'} onClick={() => setMode('pick')}>
            かんたん(1枚選ぶ)
          </button>
        </div>
        <h2 className="eff-heading">段階を選んでください</h2>
        <ul className="card-list">
          {SAFETY_LEVELS.map((l) => (
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
          <h2 className="eff-heading">安全な牌の見つけ方</h2>
          <ul>
            <li>現物:リーチした人が自分で切った牌と、リーチのあとに他の人が切って通った牌。絶対にロンされません</li>
            <li>スジ:4が現物なら1と7、5なら2と8、6なら3と9は両面待ちに当たりません</li>
            <li>壁(ノーチャンス):ある牌が4枚見えていると、それを使う両面待ちがありません</li>
            <li>字牌:見えている枚数が多いほど安全です</li>
          </ul>
          <p>危険度の数字は、よく知られた統計をもとにした目安です。</p>
        </div>
        <StorageNotice />
      </>
    )
  }

  const label = SAFETY_LEVELS.find((l) => l.id === level)?.label
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">
          安パイ並べ({label}
          {mode === 'pick' ? '・かんたん' : ''})
        </h1>
        <button type="button" className="button eff-change" onClick={() => setLevel(null)}>
          段階を変える
        </button>
      </div>
      <Drill<SafetyQuestion, SafetyAnswer>
        key={`${level}-${mode}-${seed}`}
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generateSafetyQuestion(level, mode, rng)}
        judge={safetyDrill.judge}
        renderQuestion={safetyDrill.renderQuestion}
        renderExplanation={safetyDrill.renderExplanation}
        onResult={onResult}
        favorite={favorite}
      />
      <StorageNotice compact />
    </>
  )
}

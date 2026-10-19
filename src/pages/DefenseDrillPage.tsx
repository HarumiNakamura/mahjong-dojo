import { useMemo, useState } from 'react'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { betaoriDrill } from '../drills/betaori'
import { safetyDrill } from '../drills/safety'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import { makeBetaoriQuestion, type BetaoriQuestion } from '../engine/betaoriQuestion'
import { createRng, randomInt } from '../engine/random'
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
const BETAORI_GAMES = 3

type PageMode = SafetyMode | 'betaori'

export function DefenseDrillPage() {
  const [mode, setMode] = useState<PageMode>('order')
  const [level, setLevel] = useState<SafetyLevel | null>(null)
  const [playing, setPlaying] = useState(false)
  const [seed, setSeed] = useState(0)
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite, share } = useDrillRecorder(safetyDrill)
  const betaori = useDrillRecorder(betaoriDrill)
  const newSeed = () => setSeed(Math.floor(Math.random() * 2 ** 31))

  if (mode === 'betaori' && playing) {
    return (
      <>
        <div className="eff-header">
          <h1 className="page-title">ベタオリサバイバル</h1>
          <button type="button" className="button eff-change" onClick={() => setPlaying(false)}>
            やめる
          </button>
        </div>
        <Drill<BetaoriQuestion, number[]>
          key={seed}
          totalQuestions={BETAORI_GAMES}
          makeQuestion={() => makeBetaoriQuestion(randomInt(rng, 2 ** 31))}
          judge={betaoriDrill.judge}
          renderQuestion={betaoriDrill.renderQuestion}
          renderExplanation={betaoriDrill.renderExplanation}
          onResult={betaori.onResult}
          favorite={betaori.favorite}
          share={betaori.share}
        />
        <StorageNotice compact />
      </>
    )
  }

  if (level === null || mode === 'betaori') {
    return (
      <>
        <h1 className="page-title">守備の練習</h1>
        <p className="page-lead">
          相手がリーチしています。手牌を安全な順に並べる「安パイ並べ」と、流局まで逃げ切る「ベタオリサバイバル」で練習します。終わると、牌ごとの根拠(現物・スジ・壁など)と危険度の目安が見られます。
        </p>
        <div className="waits-modes" role="group" aria-label="モード">
          <button type="button" className="waits-mode" aria-pressed={mode === 'order'} onClick={() => setMode('order')}>
            14枚を並べる
          </button>
          <button type="button" className="waits-mode" aria-pressed={mode === 'pick'} onClick={() => setMode('pick')}>
            かんたん(1枚選ぶ)
          </button>
          <button
            type="button"
            className="waits-mode"
            aria-pressed={mode === 'betaori'}
            onClick={() => setMode('betaori')}
          >
            ベタオリサバイバル
          </button>
        </div>
        {mode === 'betaori' ? (
          <div className="def-start">
            <p>
              相手のリーチのあと、流局まで1巡ずつ安全な牌を切り続けます。当たり牌を切ったらその場で終わりです。終わると、毎巡の打牌と一番安全な牌、安パイの残り方を振り返れます(
              {BETAORI_GAMES}局)。
            </p>
            <button
              type="button"
              className="button button--primary button--block"
              onClick={() => {
                setPlaying(true)
                newSeed()
              }}
            >
              はじめる
            </button>
          </div>
        ) : (
          <>
            <h2 className="eff-heading">段階を選んでください</h2>
            <ul className="card-list">
              {SAFETY_LEVELS.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    className="card card--button"
                    onClick={() => {
                      setLevel(l.id)
                      newSeed()
                    }}
                  >
                    <span className="card-title">{l.label}</span>
                    <span className="card-text">{l.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
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

  const safetyMode: SafetyMode = mode
  const label = SAFETY_LEVELS.find((l) => l.id === level)?.label
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">
          安パイ並べ({label}
          {safetyMode === 'pick' ? '・かんたん' : ''})
        </h1>
        <button type="button" className="button eff-change" onClick={() => setLevel(null)}>
          段階を変える
        </button>
      </div>
      <Drill<SafetyQuestion, SafetyAnswer>
        key={`${level}-${safetyMode}-${seed}`}
        totalQuestions={QUESTIONS_PER_SET}
        makeQuestion={() => generateSafetyQuestion(level, safetyMode, rng)}
        judge={safetyDrill.judge}
        renderQuestion={safetyDrill.renderQuestion}
        renderExplanation={safetyDrill.renderExplanation}
        onResult={onResult}
        favorite={favorite}
        share={share}
      />
      <StorageNotice compact />
    </>
  )
}

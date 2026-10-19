import { useMemo, useState } from 'react'
import { StorageNotice } from '../app/records/StorageNotice'
import { Drill } from '../components/drill/Drill'
import { useDrillRecorder } from '../drills/useDrillRecorder'
import { waitsDrill } from '../drills/waits'
import { createRng } from '../engine/random'
import { generateWaitsQuestion, WAITS_LEVELS, type WaitsLevel, type WaitsQuestion } from '../engine/waitsQuestion'
import { TIME_ATTACK_SECONDS, WaitsTimeAttack } from './waits/WaitsTimeAttack'
import './efficiency/efficiency.css'
import './records/records.css'
import './waits/waits.css'
import './pages.css'

const QUESTIONS_PER_SET = 10
type Mode = 'normal' | 'timeAttack'

export function WaitsDrillPage() {
  const [mode, setMode] = useState<Mode>('normal')
  const [level, setLevel] = useState<WaitsLevel | null>(null)
  const [seed, setSeed] = useState(0)
  const rng = useMemo(() => createRng(seed), [seed])
  const { onResult, favorite, share } = useDrillRecorder(waitsDrill)
  const newSeed = () => setSeed(Math.floor(Math.random() * 2 ** 31))

  if (level === null) {
    return (
      <>
        <h1 className="page-title">待ち当て</h1>
        <p className="page-lead">テンパイしている手を見て、待ち牌をすべて選びます。1色だけの形で、少ない枚数から順に練習しましょう。</p>
        <div className="waits-modes" role="group" aria-label="モード">
          <button type="button" className="waits-mode" aria-pressed={mode === 'normal'} onClick={() => setMode('normal')}>
            通常({QUESTIONS_PER_SET}問)
          </button>
          <button type="button" className="waits-mode" aria-pressed={mode === 'timeAttack'} onClick={() => setMode('timeAttack')}>
            タイムアタック({TIME_ATTACK_SECONDS}秒)
          </button>
        </div>
        <h2 className="eff-heading">段階を選んでください</h2>
        <ul className="card-list">
          {WAITS_LEVELS.map((l) => (
            <li key={l.size}>
              <button
                type="button"
                className="card card--button"
                onClick={() => {
                  setLevel(l.size)
                  newSeed()
                }}
              >
                <span className="card-title">{l.label}</span>
                <span className="card-text">{l.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="eff-howto">
          <h2 className="eff-heading">待ちの形</h2>
          <ul>
            <li>両面(リャンメン):23 で 1 と 4 を待つ</li>
            <li>嵌張(カンチャン):13 で 2 を待つ</li>
            <li>辺張(ペンチャン):12 で 3、89 で 7 を待つ</li>
            <li>双碰(シャンポン):対子2組のどちらかを待つ</li>
            <li>単騎(タンキ):1枚の牌の残り1枚を待つ</li>
          </ul>
          <p>1つの手で、いくつもの見方ができることがあります。見方ごとに待ちを探すと、見落としが減ります。</p>
        </div>
        <StorageNotice />
      </>
    )
  }

  const label = WAITS_LEVELS.find((l) => l.size === level)?.label
  return (
    <>
      <div className="eff-header">
        <h1 className="page-title">
          待ち当て({label}
          {mode === 'timeAttack' ? '・タイムアタック' : ''})
        </h1>
        <button type="button" className="button eff-change" onClick={() => setLevel(null)}>
          段階を変える
        </button>
      </div>
      {mode === 'timeAttack' ? (
        <WaitsTimeAttack key={seed} level={level} seed={seed} onRestart={newSeed} />
      ) : (
        <Drill<WaitsQuestion, number[]>
          key={`${level}-${seed}`}
          totalQuestions={QUESTIONS_PER_SET}
          makeQuestion={() => generateWaitsQuestion(level, rng)}
          judge={waitsDrill.judge}
          renderQuestion={waitsDrill.renderQuestion}
          renderExplanation={waitsDrill.renderExplanation}
          onResult={onResult}
          favorite={favorite}
          share={share}
        />
      )}
      <StorageNotice compact />
    </>
  )
}

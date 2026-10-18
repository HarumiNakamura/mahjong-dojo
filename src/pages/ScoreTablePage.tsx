import { useState } from 'react'
import { Link } from '../app/Link'
import { LimitTableView, ScoreTableView } from './score/ScoreTableView'
import './score/score.css'
import './pages.css'

/** 点数早見表(Mリーグルール版) */
export function ScoreTablePage() {
  const [dealer, setDealer] = useState(false)
  return (
    <>
      <h1 className="page-title">点数早見表</h1>
      <p className="page-lead">符と翻から点数を引ける表です。Mリーグ公式ルール版です。</p>
      <ul className="score-rules">
        <li>
          <strong>切り上げ満貫あり</strong>:30符4翻・60符3翻は満貫として扱います。
        </li>
        <li>
          <strong>数え役満なし</strong>:13翻以上でも三倍満です。
        </li>
        <li>各マスの上の数字がロン、下がツモの支払い(子のアガリは「子の支払い/親の支払い」、親のアガリは「◯オール」)です。</li>
        <li>「−」はありえない組み合わせです(20符はピンフのツモだけ、25符は七対子だけ)。</li>
        <li>本場は1本につきロンなら300点、ツモなら1人100点ずつ加わります。</li>
      </ul>
      <div className="score-tabs" role="group" aria-label="親か子か">
        <button type="button" className="score-tab" aria-pressed={!dealer} onClick={() => setDealer(false)}>
          子のアガリ
        </button>
        <button type="button" className="score-tab" aria-pressed={dealer} onClick={() => setDealer(true)}>
          親のアガリ
        </button>
      </div>
      <h2 className="eff-heading">{dealer ? '親' : '子'}:符×翻(1〜4翻)</h2>
      <ScoreTableView dealer={dealer} />
      <h2 className="eff-heading">{dealer ? '親' : '子'}:満貫以上</h2>
      <LimitTableView dealer={dealer} />
      <p>
        <Link to="/practice/score">点数計算ドリルで練習する</Link>
      </p>
    </>
  )
}

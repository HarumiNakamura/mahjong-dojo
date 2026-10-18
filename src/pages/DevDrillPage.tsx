import { Drill } from '../components/drill/Drill'
import { Hand } from '../components/tile/Hand'
import { calcShantenFromTiles } from '../engine/shanten'
import type { Tile } from '../engine/tiles'
import { SAMPLE_HANDS } from './devDrillData'
import './pages.css'

// ドリル共通部品の動作確認用: 「この手は何シャンテン?」
interface Question {
  hand: Tile[]
}

const CHOICES = [0, 1, 2, 3]

function shantenLabel(n: number): string {
  if (n === -1) return 'アガリ'
  if (n === 0) return 'テンパイ'
  return `${n}シャンテン`
}

export function DevDrillPage() {
  return (
    <>
      <h1 className="page-title">ドリル部品の確認</h1>
      <p className="page-lead">開発用のページです。手牌のシャンテン数を答えてください。</p>
      <Drill<Question, number>
        totalQuestions={SAMPLE_HANDS.length}
        makeQuestion={(i) => ({ hand: SAMPLE_HANDS[i % SAMPLE_HANDS.length] })}
        judge={(q, a) => calcShantenFromTiles(q.hand).min === a}
        renderQuestion={({ question, answered, answer, onAnswer }) => {
          const correct = calcShantenFromTiles(question.hand).min
          return (
            <>
              <p className="drill-prompt">この手は何シャンテン?</p>
              <Hand tiles={question.hand} />
              <div className="choice-list">
                {CHOICES.map((c) => {
                  let cls = 'choice-button'
                  if (answered && c === correct) cls += ' choice-button--correct'
                  else if (answered && c === answer) cls += ' choice-button--wrong'
                  return (
                    <button key={c} type="button" className={cls} disabled={answered} onClick={() => onAnswer(c)}>
                      {shantenLabel(c)}
                    </button>
                  )
                })}
              </div>
            </>
          )
        }}
        renderExplanation={({ question, answer, correct }) => {
          const r = calcShantenFromTiles(question.hand)
          return (
            <>
              {!correct && (
                <p>
                  あなたの答え: {shantenLabel(answer)} / 正解: <strong>{shantenLabel(r.min)}</strong>
                </p>
              )}
              <p>3つの形でそれぞれ数えて、いちばん小さい数が答えです。</p>
              <ul>
                <li>通常の形(4面子1雀頭): {shantenLabel(r.normal)}</li>
                <li>七対子: {shantenLabel(r.chiitoitsu)}</li>
                <li>国士無双: {shantenLabel(r.kokushi)}</li>
              </ul>
            </>
          )
        }}
      />
    </>
  )
}

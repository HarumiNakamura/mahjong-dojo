import { useState } from 'react'
import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { kindOf, tileName } from '../../engine/tiles'
import { suitOfQuestion, WAITS_LEVELS, type WaitsQuestion } from '../../engine/waitsQuestion'

/** 待ち当ての問題:手牌を見て、待ち牌をすべて選んで回答する */
export function WaitsQuestionView({ question, answered, answer, onAnswer }: QuestionViewProps<WaitsQuestion, number[]>) {
  const [selected, setSelected] = useState<number[]>([])
  const suit = suitOfQuestion(question)
  const kinds = Array.from({ length: 9 }, (_, i) => kindOf(suit, i + 1))
  const correct = new Set(question.result.waits.map((w) => w.kind))
  const chosen = new Set(answered ? (answer ?? []) : selected)
  const label = WAITS_LEVELS.find((l) => l.size === question.level)?.label

  const toggle = (k: number) => {
    if (answered) return
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k].sort((a, b) => a - b)))
  }

  return (
    <div className="waits-q">
      <div className="eff-meta">
        <span className="badge">{label}</span>
      </div>
      <p className="drill-prompt">待ち牌をすべて選んでください</p>
      <div className="waits-hand">
        <Hand tiles={question.hand} />
      </div>

      <div className="waits-choices" role="group" aria-label="待ち牌の候補">
        {kinds.map((k) => {
          let state = ''
          if (answered) {
            if (correct.has(k) && chosen.has(k)) state = ' waits-choice--hit'
            else if (correct.has(k)) state = ' waits-choice--missed'
            else if (chosen.has(k)) state = ' waits-choice--extra'
          } else if (chosen.has(k)) {
            state = ' waits-choice--selected'
          }
          return (
            <button
              key={k}
              type="button"
              className={`waits-choice${state}`}
              aria-pressed={chosen.has(k)}
              aria-label={tileName({ kind: k, red: false })}
              disabled={answered}
              onClick={() => toggle(k)}
            >
              <Tile tile={{ kind: k, red: false }} showLabel={false} />
              {answered && (
                <span className="waits-choice-mark" aria-hidden="true">
                  {correct.has(k) && chosen.has(k) ? '○' : correct.has(k) ? '△' : chosen.has(k) ? '×' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {answered && <p className="waits-choice-legend">○ 正解した待ち / △ 見落とした待ち / × 待ちではない牌</p>}

      {!answered && (
        <button
          type="button"
          className="button button--primary button--block waits-submit"
          onClick={() => onAnswer(selected)}
        >
          {selected.length === 0 ? '待ちなしで回答する' : `${selected.length}種で回答する`}
        </button>
      )}
    </div>
  )
}

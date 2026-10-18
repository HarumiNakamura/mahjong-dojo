import { useState } from 'react'
import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import {
  expectedPoints,
  SCORE_LEVELS,
  WIND_NAMES,
  type ScoreAnswer,
  type ScoreQuestion,
} from '../../engine/scoreQuestion'

const MELD_LABELS = { chi: 'チー', pon: 'ポン', minkan: '明槓', ankan: '暗槓', kakan: '加槓' }
const HAN_CHOICES = Array.from({ length: 13 }, (_, i) => i + 1)
const FU_CHOICES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110]

/** 手牌・副露・状況の表示(問題と解説で共通) */
export function ScoreSituation({ question }: { question: ScoreQuestion }) {
  const { context: c, melds } = question
  const rest = [...question.hand]
  rest.splice(
    rest.findIndex((t) => t.kind === question.winTile.kind && t.red === question.winTile.red),
    1,
  )
  return (
    <div className="score-situation">
      <div className="score-chips">
        <span className="score-chip">{WIND_NAMES[c.roundWind]}場</span>
        <span className="score-chip">
          {WIND_NAMES[c.seatWind]}家({c.seatWind === 1 ? '親' : '子'})
        </span>
        <span className="score-chip score-chip--strong">{c.tsumo ? 'ツモ' : 'ロン'}</span>
        {c.riichi && <span className="score-chip">リーチ</span>}
        {c.ippatsu && <span className="score-chip">一発</span>}
        {melds.length > 0 && <span className="score-chip">鳴きあり</span>}
      </div>
      <div className="score-dora">
        <span>ドラ表示牌</span>
        {(c.doraIndicators ?? []).map((t, i) => (
          <Tile key={i} tile={t} />
        ))}
        {(c.uraDoraIndicators ?? []).length > 0 && (
          <>
            <span>裏ドラ表示牌</span>
            {c.uraDoraIndicators!.map((t, i) => (
              <Tile key={i} tile={t} />
            ))}
          </>
        )}
      </div>
      <div className="score-hand">
        <Hand tiles={rest} drawn={question.winTile} />
        <p className="score-hand-note">右端がアガリ牌</p>
      </div>
      {melds.length > 0 && (
        <div className="score-melds">
          {melds.map((m, i) => (
            <span key={i} className="score-meld">
              <span className="score-meld-label">{MELD_LABELS[m.type]}</span>
              {m.tiles.map((t, j) => (
                <Tile key={j} tile={t} />
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function ScoreQuestionView({ question, answered, onAnswer }: QuestionViewProps<ScoreQuestion, ScoreAnswer>) {
  const level = question.data.level
  return (
    <div className="score-q">
      <div className="eff-meta">
        <span className="badge">{SCORE_LEVELS.find((l) => l.id === level)?.label}</span>
      </div>
      <ScoreSituation question={question} />
      {level === 'beginner' && <YakuAnswer question={question} answered={answered} onAnswer={onAnswer} />}
      {level === 'intermediate' && <HanFuAnswer answered={answered} onAnswer={onAnswer} />}
      {level === 'advanced' && <PointsAnswer question={question} answered={answered} onAnswer={onAnswer} />}
    </div>
  )
}

function YakuAnswer({ question, answered, onAnswer }: { question: ScoreQuestion; answered: boolean; onAnswer: (a: ScoreAnswer) => void }) {
  const [chosen, setChosen] = useState<string[]>([])
  const correct = new Set(question.result.yaku.map((y) => y.name))
  return (
    <>
      <p className="drill-prompt">成立している役をすべて選んでください(ドラは役ではありません)</p>
      <div className="score-yaku-choices">
        {question.data.choices.map((name) => {
          const on = chosen.includes(name)
          let cls = 'choice-button'
          if (answered && correct.has(name)) cls += ' choice-button--correct'
          else if (answered && on) cls += ' choice-button--wrong'
          else if (on) cls += ' choice-button--chosen'
          return (
            <button
              key={name}
              type="button"
              className={cls}
              aria-pressed={on}
              disabled={answered}
              onClick={() => setChosen((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]))}
            >
              {name}
            </button>
          )
        })}
      </div>
      {!answered && (
        <button type="button" className="button button--primary button--block score-submit" disabled={chosen.length === 0} onClick={() => onAnswer({ yaku: chosen })}>
          回答する
        </button>
      )}
    </>
  )
}

function HanFuAnswer({ answered, onAnswer }: { answered: boolean; onAnswer: (a: ScoreAnswer) => void }) {
  const [han, setHan] = useState<number | null>(null)
  const [fu, setFu] = useState<number | null>(null)
  const chips = (values: number[], value: number | null, set: (n: number) => void, unit: string) => (
    <div className="score-chip-choices">
      {values.map((v) => (
        <button key={v} type="button" className={`score-pick${value === v ? ' score-pick--on' : ''}`} aria-pressed={value === v} disabled={answered} onClick={() => set(v)}>
          {v}
          {unit}
        </button>
      ))}
    </div>
  )
  return (
    <>
      <p className="drill-prompt">翻数(ドラを含む)と符を答えてください</p>
      <p className="score-field-label">翻数</p>
      {chips(HAN_CHOICES, han, setHan, '翻')}
      <p className="score-field-label">符</p>
      {chips(FU_CHOICES, fu, setFu, '符')}
      {!answered && (
        <button
          type="button"
          className="button button--primary button--block score-submit"
          disabled={han === null || fu === null}
          onClick={() => onAnswer({ han: han!, fu: fu! })}
        >
          回答する
        </button>
      )}
    </>
  )
}

function PointsAnswer({ question, answered, onAnswer }: { question: ScoreQuestion; answered: boolean; onAnswer: (a: ScoreAnswer) => void }) {
  const c = question.context
  const labels = !c.tsumo ? ['ロンの点数'] : c.seatWind === 1 ? ['1人あたりの支払い(オール)'] : ['子の支払い', '親の支払い']
  const [values, setValues] = useState<string[]>(labels.map(() => ''))
  const parsed = values.map((v) => Number(v.replace(/[,，\s点]/g, '')))
  const valid = parsed.every((n) => Number.isInteger(n) && n > 0) && parsed.length === expectedPoints(question).length
  return (
    <>
      <p className="drill-prompt">
        {c.tsumo ? (c.seatWind === 1 ? '親のツモです。1人あたりいくら払ってもらいますか?' : '子のツモです。子と親はそれぞれいくら払いますか?') : 'ロンです。何点ですか?'}
      </p>
      <div className="score-inputs">
        {labels.map((label, i) => (
          <label key={label} className="score-input">
            <span>{label}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="例: 3900"
              value={values[i]}
              disabled={answered}
              onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <span>点</span>
          </label>
        ))}
      </div>
      {!answered && (
        <button type="button" className="button button--primary button--block score-submit" disabled={!valid} onClick={() => onAnswer({ points: parsed })}>
          回答する
        </button>
      )}
      <p className="score-hint">本場・供託はありません。</p>
    </>
  )
}

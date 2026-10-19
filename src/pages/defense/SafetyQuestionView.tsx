import { useState } from 'react'
import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { riichiSeats, SEAT_NAMES } from '../../engine/danger'
import { orderMarks, SAFETY_LEVELS, type SafetyAnswer, type SafetyQuestion } from '../../engine/safetyQuestion'
import { DefenseRivers } from './DefenseRivers'
import { SortableTiles } from './SortableTiles'

/** 局面の情報(巡目・ドラ・誰がリーチしているか) */
export function DefenseMeta({ question }: { question: { level: string; situation: SafetyQuestion['situation'] } }) {
  const s = question.situation
  const label = SAFETY_LEVELS.find((l) => l.id === question.level)?.label
  const who = riichiSeats(s)
    .map((seat) => `${SEAT_NAMES[seat]}${seat === s.dealerSeat ? '(親)' : ''}`)
    .join('と')
  return (
    <>
      <div className="eff-meta">
        {label && <span className="badge">{label}</span>}
        <span>{s.turn}巡目</span>
        <span className="eff-dora">
          ドラ表示牌
          <span className="eff-dora-tile">
            <Tile tile={s.doraIndicator} />
          </span>
        </span>
      </div>
      <p className="def-alert">{who}がリーチしています</p>
    </>
  )
}

/** 安パイ並べの問題: 14枚を安全な順に並べる(かんたんモードは一番安全な1枚を選ぶ) */
export function SafetyQuestionView({ question, answered, answer, onAnswer }: QuestionViewProps<SafetyQuestion, SafetyAnswer>) {
  const [order, setOrder] = useState<number[]>(() => question.tiles.map((_, i) => i))
  const s = question.situation

  return (
    <div className="def-q">
      <DefenseMeta question={question} />
      <DefenseRivers situation={s} />

      {question.mode === 'pick' ? (
        <>
          <p className="drill-prompt">一番安全な牌はどれですか?</p>
          {answered ? (
            <Hand tiles={s.myHand} drawn={s.drawn} selected={answer ? question.tiles.findIndex((t) => t.kind === answer[0]) : null} full />
          ) : (
            <Hand tiles={s.myHand} drawn={s.drawn} onPick={(i) => onAnswer([question.tiles[i].kind])} pickLabel="にする" />
          )}
        </>
      ) : (
        <>
          <p className="drill-prompt">安全な順に並べてください</p>
          {answered && answer ? (
            <SortableTiles
              tiles={question.tiles}
              order={answer.map((kind, pos, all) => {
                // 回答の牌の種類を、手牌の位置に戻す(同じ種類は前から順に)
                const nth = all.slice(0, pos).filter((k) => k === kind).length
                return question.tiles.map((t, i) => [t, i] as const).filter(([t]) => t.kind === kind)[nth][1]
              })}
              marks={orderMarks(question, answer)}
            />
          ) : (
            <>
              <SortableTiles tiles={question.tiles} order={order} onChange={setOrder} />
              <p className="eff-hint">
                牌を押したまま左右・上下に動かすと並べ替えられます。タップで選んでから、置きたい場所をタップしても動かせます。
              </p>
              <button
                type="button"
                className="button button--primary button--block"
                onClick={() => onAnswer(order.map((i) => question.tiles[i].kind))}
              >
                この順番で回答する
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import type { QuestionViewProps } from '../../components/drill/Drill'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { callLabel, type CallAnswer, type CallOption } from '../../engine/call'
import type { CallQuestion } from '../../engine/callQuestion'
import { WIND_NAMES } from '../../engine/scoreQuestion'
import { SEAT_NAMES } from '../../engine/danger'
import { tileName } from '../../engine/tiles'

/** 鳴いた面子(鳴いた牌を横向きにする) */
export function MeldTiles({ option, tile }: { option: CallOption; tile: CallQuestion['situation']['tile'] }) {
  return (
    <span className="call-meld">
      {option.meld.map((k, i) =>
        k === tile.kind && option.meld.indexOf(k) === i ? (
          <Tile key={i} tile={tile} sideways />
        ) : (
          <Tile key={i} tile={{ kind: k, red: false }} />
        ),
      )}
    </span>
  )
}

/** 鳴き判断の問題: ポン・チー・スルーを選び、鳴くなら打牌も選ぶ */
export function CallQuestionView({ question: q, answered, answer, onAnswer }: QuestionViewProps<CallQuestion, CallAnswer>) {
  const s = q.situation
  const [option, setOption] = useState<CallOption | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const chosen =
    answered && answer && answer.type !== 'skip'
      ? (q.analysis.options.find((o) => o.type === answer.type && o.using.join() === [...answer.using].sort((a, b) => a - b).join()) ?? null)
      : option
  // 鳴きに使った2枚を除いた手牌
  const rest = (() => {
    if (!chosen) return s.hand
    const r = [...s.hand]
    for (const u of chosen.using) r.splice(r.findIndex((t) => t.kind === u), 1)
    return r
  })()

  return (
    <div className="def-q">
      <div className="eff-meta">
        <span>{s.turn}巡目</span>
        <span>
          {WIND_NAMES[s.roundWind]}場・自風 {WIND_NAMES[s.seatWind]}
        </span>
        <span className="eff-dora">
          ドラ表示牌
          <span className="eff-dora-tile">
            <Tile tile={s.doraIndicator} />
          </span>
        </span>
      </div>
      <p className="call-discard">
        {SEAT_NAMES[s.from]}が
        <span className="call-discard-tile">
          <Tile tile={s.tile} />
        </span>
        を切りました
      </p>

      {!chosen ? (
        <>
          <Hand tiles={s.hand} />
          <p className="drill-prompt">鳴きますか?</p>
          <div className="call-choices">
            {q.analysis.options.map((o) => (
              <button
                key={o.type + o.using.join()}
                type="button"
                className="button button--block"
                disabled={answered}
                onClick={() => {
                  setOption(o)
                  setSelected(null)
                }}
              >
                <span className="call-choice-label">{o.type === 'pon' ? 'ポン' : 'チー'}</span>
                {o.type === 'chi' && (
                  <span className="call-choice-tiles" aria-label={callLabel(o.type, o.using)}>
                    <MeldTiles option={o} tile={s.tile} />
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              className={`button button--block${answered && answer?.type === 'skip' ? ' button--primary' : ''}`}
              disabled={answered}
              onClick={() => onAnswer({ type: 'skip' })}
            >
              スルー
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="call-made">
            {callLabel(chosen.type, chosen.using)}:
            <MeldTiles option={chosen} tile={s.tile} />
          </p>
          <Hand
            tiles={rest}
            selected={answered && answer?.type !== 'skip' && answer ? rest.findIndex((t) => t.kind === answer.discard) : selected}
            onSelect={answered ? undefined : (i) => setSelected(i)}
            isDisabled={(i) => chosen.forbidden.includes(rest[i].kind)}
          />
          {!answered && (
            <>
              <p className="eff-hint">
                鳴いたあとに切る牌を選んでください。
                {chosen.forbidden.length > 0 &&
                  `${chosen.forbidden.map((k) => tileName({ kind: k, red: false })).join('・')}は喰い替えになるので切れません。`}
              </p>
              <div className="call-choices">
                <button type="button" className="button button--block" onClick={() => setOption(null)}>
                  戻る
                </button>
                <button
                  type="button"
                  className="button button--primary button--block"
                  disabled={selected === null || chosen.forbidden.includes(rest[selected].kind)}
                  onClick={() =>
                    selected !== null && onAnswer({ type: chosen.type, using: chosen.using, discard: rest[selected].kind })
                  }
                >
                  {selected === null ? '牌を選んでください' : `${tileName(rest[selected])}を切る`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

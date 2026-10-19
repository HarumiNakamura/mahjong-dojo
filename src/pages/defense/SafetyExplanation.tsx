import { useState } from 'react'
import { Term } from '../../components/term/Term'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { dealsIn, riichiSeats, riichiWaits, SEAT_NAMES, type DefenseSituation, type TileSafety } from '../../engine/danger'
import { orderMarks, safestKinds, type SafetyAnswer, type SafetyQuestion } from '../../engine/safetyQuestion'
import { tileName } from '../../engine/tiles'
import { DefenseRivers } from './DefenseRivers'
import { dangerLevel } from './defenseUi'
import { SujiBoard } from './SujiBoard'

const name = (kind: number) => tileName({ kind, red: false })

/** 牌ごとの根拠の一覧。行をタップすると、根拠になった河の牌とスジ表の位置が光る */
export function SafetyTable({
  situation,
  assessments,
  rankOf,
  marks,
}: {
  situation: DefenseSituation
  assessments: readonly TileSafety[]
  rankOf: (kind: number) => number
  /** 牌の種類ごとの印(自分の答えの正誤など) */
  marks?: ReadonlyMap<number, string>
}) {
  const [focus, setFocus] = useState<number | null>(assessments[0]?.kind ?? null)
  const focused = assessments.find((a) => a.kind === focus) ?? null
  const seats = riichiSeats(situation)
  return (
    <div className="def-table">
      <ol className="def-rows">
        {assessments.map((a) => (
          <li key={a.kind}>
            <button
              type="button"
              className={`def-row${focus === a.kind ? ' def-row--focus' : ''}`}
              aria-pressed={focus === a.kind}
              onClick={() => setFocus(a.kind)}
            >
              <span className="def-row-rank">{rankOf(a.kind) + 1}</span>
              <span className="def-row-tile">
                <Tile tile={{ kind: a.kind, red: false }} />
              </span>
              <span className="def-row-label">
                {a.perPlayer.map((p) => (seats.length > 1 ? `${SEAT_NAMES[p.seat]}: ${p.label}` : p.label)).join(' / ')}
              </span>
              <span className={`def-danger def-danger--${dangerLevel(a.danger)}`}>{a.danger}%</span>
              {marks?.get(a.kind) && <span className="def-row-mark">{marks.get(a.kind)}</span>}
            </button>
          </li>
        ))}
      </ol>
      {focused && (
        <div className="def-reasons" aria-live="polite">
          <p className="def-reasons-title">
            {name(focused.kind)}:放銃率の目安 約{focused.danger}%
          </p>
          {focused.perPlayer.map((p) => (
            <div key={p.seat}>
              {seats.length > 1 && <p className="def-reasons-seat">{SEAT_NAMES[p.seat]}に対して({p.label}・{p.danger}%)</p>}
              <ul>
                {p.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="def-hint">光っている河の牌が根拠です。</p>
        </div>
      )}
      <DefenseRivers situation={situation} highlight={focused?.perPlayer.flatMap((p) => p.riverRefs) ?? []} />
      {seats.map((seat) => (
        <SujiBoard key={seat} situation={situation} seat={seat} focus={focus} />
      ))}
    </div>
  )
}

/** リーチ者の手牌と待ちを公開する */
export function RiichiReveal({ situation }: { situation: DefenseSituation }) {
  return (
    <div className="def-reveal">
      {riichiSeats(situation).map((seat) => (
        <div key={seat}>
          <p className="def-reveal-title">
            {SEAT_NAMES[seat]}の手牌(待ち: {riichiWaits(situation, seat).map(name).join('・')})
          </p>
          <Hand tiles={situation.hands[seat]} />
        </div>
      ))}
    </div>
  )
}

export function SafetyExplanation({ question: q, answer }: { question: SafetyQuestion; answer: SafetyAnswer }) {
  const rankOf = (kind: number) => q.groups.get(kind) ?? 0
  const hits = [...new Set(q.tiles.map((t) => t.kind))].filter((k) => dealsIn(q.situation, k).length > 0)
  let summary: string
  const marks = new Map<number, string>()
  if (q.mode === 'pick') {
    const chosen = q.assessments.find((a) => a.kind === answer[0])
    const safest = safestKinds(q)
    summary = `選んだ牌: ${name(answer[0])}(${chosen?.perPlayer.map((p) => p.label).join('・')}・約${chosen?.danger}%)。一番安全なのは ${safest.map(name).join('・')} です。`
    marks.set(answer[0], '選択')
  } else {
    const ok = orderMarks(q, answer)
    summary = `14枚中 ${ok.filter(Boolean).length}枚が安全な順に並んでいます(危険度が同じ牌どうしの順番は問いません)。`
    answer.forEach((k, i) => {
      if (!ok[i]) marks.set(k, '×')
    })
  }
  return (
    <div className="def-expl">
      <p>{summary}</p>
      <p className="def-hint">
        安全な順(数字が同じ牌は同じ危険度)。{q.mode === 'order' ? '× は順番を崩している牌です。' : ''}
        行をタップすると根拠が見られます。
      </p>
      <SafetyTable situation={q.situation} assessments={q.assessments} rankOf={rankOf} marks={marks} />
      <RiichiReveal situation={q.situation} />
      <p>
        {hits.length > 0
          ? `この手牌で実際に当たる牌: ${hits.map(name).join('・')}`
          : 'この手牌には、実際に当たる牌はありませんでした。'}
      </p>
      <p className="def-rule">
        覚え方:まず<Term id="genbutsu">現物</Term>、次に<Term id="jihai">字牌</Term>(見えている枚数が多いもの)と<Term id="suji">スジ</Term>・<Term id="kabe">壁</Term>。<Term id="musuji">無スジ</Term>の4・5・6が一番危険です。
      </p>
    </div>
  )
}

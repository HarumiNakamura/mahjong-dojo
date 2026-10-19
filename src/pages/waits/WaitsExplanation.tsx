import { Tile } from '../../components/tile/Tile'
import { tileName } from '../../engine/tiles'
import { WAIT_SHAPE_LABELS, shapeLabels, type Block, type WaitPattern } from '../../engine/waits'
import { compareWaitsAnswer, type WaitsQuestion } from '../../engine/waitsQuestion'

/** 1つの待ちについて見せる見方の数 */
const PATTERNS_SHOWN = 3
/** 色分けに使う色の数(これより多い待ちは色を付けず、見出しの文字で区別する) */
const WAIT_COLORS = 8

const names = (kinds: readonly number[]) => kinds.map((k) => tileName({ kind: k, red: false })).join('・')

function Group({ kinds, className }: { kinds: readonly number[]; className: string }) {
  return (
    <span className={`waits-group ${className}`}>
      {kinds.map((k, i) => (
        <Tile key={i} tile={{ kind: k, red: false }} showLabel={false} />
      ))}
    </span>
  )
}

const BLOCK_LABELS: Record<Block['type'], string> = { shuntsu: '順子', koutsu: '刻子', pair: '雀頭' }

function PatternRow({ pattern, wait, color }: { pattern: WaitPattern; wait: number; color: string }) {
  return (
    <div className="waits-pattern">
      <div className="waits-pattern-tiles">
        <span className="waits-wait-group" style={{ ['--wait-color' as string]: color }}>
          <Group kinds={pattern.waiting} className="waits-group--waiting" />
          <span className="waits-plus" aria-hidden="true">
            +
          </span>
          <Group kinds={[wait]} className="waits-group--win" />
        </span>
        {pattern.others.map((b, i) => (
          <Group key={i} kinds={b.kinds} className="waits-group--other" />
        ))}
      </div>
      <p className="waits-pattern-text">
        {pattern.shape === 'kokushi'
          ? `么九牌13種がそろうので国士無双。`
          : `${names(pattern.waiting)}が${WAIT_SHAPE_LABELS[pattern.shape]}で${tileName({ kind: wait, red: false })}を待つ。` +
            (pattern.others.length > 0 ? `残りは${pattern.others.map((b) => BLOCK_LABELS[b.type]).join('・')}。` : '')}
      </p>
    </div>
  )
}

export function WaitsExplanation({ question, answer }: { question: WaitsQuestion; answer: number[] }) {
  const { waits, usedUp } = question.result
  const { missed, extra } = compareWaitsAnswer(question, answer)
  return (
    <>
      <p>
        待ちは{waits.length}種:<strong>{names(waits.map((w) => w.kind))}</strong>
      </p>
      {missed.length > 0 && (
        <p>
          見落とした待ち:
          {missed
            .map((k) => {
              // 見落とした待ちは、どの塊で待っているかを一言で
              const p = waits.find((w) => w.kind === k)?.patterns[0]
              const why = p && p.shape !== 'kokushi' ? `(${names(p.waiting)}の${WAIT_SHAPE_LABELS[p.shape]})` : ''
              return `${tileName({ kind: k, red: false })}${why}`
            })
            .join('、')}
        </p>
      )}
      {extra.length > 0 && <p>待ちではない牌:{names(extra)}(引いてもアガリの形になりません)</p>}
      {usedUp.length > 0 && <p>{names(usedUp)}は自分で4枚使っているので、待ちになりません。</p>}

      <h3 className="eff-heading">どの塊がどの待ちを作るか</h3>
      <p className="waits-legend-note">色の枠が待ちを作っている塊、「+」の右がアガリ牌です。灰色の枠は完成している面子・雀頭です。</p>
      <ol className="waits-list">
        {waits.map((w, i) => {
          const color = i < WAIT_COLORS ? `var(--wait-${i + 1})` : 'var(--text-muted)'
          const shown = w.patterns.slice(0, PATTERNS_SHOWN)
          return (
            <li key={w.kind} className="waits-item" style={{ ['--wait-color' as string]: color }}>
              <p className="waits-item-head">
                <span className="waits-swatch" aria-hidden="true" />
                <Tile tile={{ kind: w.kind, red: false }} showLabel={false} />
                <strong>{tileName({ kind: w.kind, red: false })}待ち</strong>
                <span className="waits-shape">{shapeLabels(w.shapes)}</span>
              </p>
              {shown.map((p, j) => (
                <PatternRow key={j} pattern={p} wait={w.kind} color={color} />
              ))}
              {w.patterns.length > PATTERNS_SHOWN && (
                <p className="waits-more">ほかに{w.patterns.length - PATTERNS_SHOWN}通りの見方があります。</p>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}

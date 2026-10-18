import { callLabel, type CallAnswer } from '../../engine/call'
import type { CallQuestion } from '../../engine/callQuestion'
import { tileName } from '../../engine/tiles'

const name = (k: number) => tileName({ kind: k, red: false })

/** 鳴き方ごとの判断(役・シャンテン数・翻数)と、正しい打牌 */
export function CallExplanation({ question: q, answer }: { question: CallQuestion; answer: CallAnswer }) {
  const a = q.analysis
  const good = a.goodOptions.map((o) => `${callLabel(o.type, o.using)}して${name(o.best.kind)}切り`)
  const verdictText =
    a.verdict === 'skip' ? 'スルー' : a.verdict === 'call' ? good.join(' / ') : `スルー、または ${good.join(' / ')}(差が小さいのでどちらも正解)`
  const chosen = answer.type === 'skip' ? null : a.options.find((o) => o.type === answer.type && o.using.join() === [...answer.using].sort((x, y) => x - y).join())
  const chosenDiscard = chosen && answer.type !== 'skip' ? chosen.discards.find((d) => d.kind === answer.discard) : null
  return (
    <div className="def-expl">
      <p>
        正解: <strong>{verdictText}</strong>
      </p>
      <p>
        鳴かないとき: シャンテン数 {a.shanten}。{a.closedReasons.join('')}
      </p>
      <ol className="plan-scores">
        {a.options.map((o) => (
          <li key={o.type + o.using.join()} className={`plan-score${a.goodOptions.includes(o) && a.verdict !== 'skip' ? ' plan-score--correct' : ''}`}>
            <div className="plan-score-head">
              <span>{callLabel(o.type, o.using)}</span>
              <span>{o.best.yaku.length > 0 ? o.best.yaku.join('・') : '役なし'}</span>
            </div>
            <ul className="plan-reasons">
              {o.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
              {o.best.yaku.length > 0 && <li>鳴いたあとは {name(o.best.kind)} を切るのが一番良い形です。</li>}
              {o.forbidden.length > 0 && <li>{o.forbidden.map(name).join('・')}は喰い替えになるので切れません(Mリーグルール)。</li>}
            </ul>
          </li>
        ))}
      </ol>
      {chosenDiscard && chosen && (chosenDiscard.yaku.length === 0 || chosenDiscard.shanten > chosen.best.shanten) && (
        <p>
          あなたの打牌 {name(chosenDiscard.kind)}:
          {chosenDiscard.yaku.length === 0 ? '切ると役がなくなります。' : `シャンテン数が ${chosenDiscard.shanten} になり、${name(chosen.best.kind)} 切り(${chosen.best.shanten})より遅れます。`}
        </p>
      )}
      <p className="def-rule">
        {a.verdict === 'skip'
          ? a.options.every((o) => o.best.yaku.length === 0)
            ? '鳴くと役がなくなるときはスルー。門前ならリーチで役が作れます。'
            : 'シャンテン数が進まない鳴き、打点が大きく下がる鳴きはスルーが基本です。'
          : '役が確定してシャンテン数が進む鳴き(特に役牌のポン)は、積極的に鳴きましょう。'}
      </p>
    </div>
  )
}

import { Hand } from '../../components/tile/Hand'
import { handView } from '../../game/convert'
import { PLAYER_NAMES, type GameSession } from '../../game/session'
import { formatPoints } from '../../game/result'

const WINDS = ['東', '南', '西', '北']

/** 局の結果(アガリ・流局)と半荘の結果。次へ進むボタンつき */
export function PlayResult({ session, onRestart }: { session: GameSession; onRestart: () => void }) {
  const { human } = session
  const req = human.request
  const model = human.model
  if (!req || (req.kind !== 'hule' && req.kind !== 'pingju' && req.kind !== 'jieju')) return null
  const next = () => human.reply({})
  const nameOf = (l: number) => PLAYER_NAMES[model.player_id[l]]

  if (req.kind === 'jieju') {
    const final = session.game.final
    const order = [0, 1, 2, 3].sort((a, b) => (final ? final.ranks[a] - final.ranks[b] : 0))
    return (
      <div className="play-result" role="dialog" aria-label="半荘の結果">
        <h2 className="play-result-title">半荘終了</h2>
        {final && (
          <table className="play-result-table">
            <tbody>
              {order.map((id) => (
                <tr key={id} className={id === 0 ? 'play-result-me' : ''}>
                  <td>{final.ranks[id]}位</td>
                  <td>{PLAYER_NAMES[id]}</td>
                  <td>{final.scores[id].toLocaleString('ja-JP')}点</td>
                  <td>{formatPoints(final.points10[id])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button type="button" className="button button--primary button--block" onClick={onRestart}>
          もう一度対局する
        </button>
      </div>
    )
  }

  if (req.kind === 'hule') {
    const h = req.hule as { l: number; baojia: number | null; shoupai: string; hupai: { name: string; fanshu: number | string }[]; fu?: number; fanshu?: number; defen: number }
    const v = handView(h.shoupai)
    return (
      <div className="play-result" role="dialog" aria-label="局の結果">
        <h2 className="play-result-title">
          {nameOf(h.l)}({WINDS[h.l]})の{h.baojia === null ? 'ツモ' : 'ロン'}
        </h2>
        <div className="play-result-hand">
          <Hand tiles={v.tiles} drawn={v.drawn} />
        </div>
        <ul className="play-result-yaku">
          {h.hupai.map((y) => (
            <li key={y.name}>
              {y.name} {typeof y.fanshu === 'number' ? `${y.fanshu}翻` : '役満'}
            </li>
          ))}
        </ul>
        <p className="play-result-points">
          {h.fu ? `${h.fu}符${h.fanshu}翻 ` : ''}
          {h.defen.toLocaleString('ja-JP')}点{h.baojia !== null && `(${nameOf(h.baojia)}から)`}
        </p>
        <button type="button" className="button button--primary button--block" onClick={next}>
          次へ
        </button>
      </div>
    )
  }

  const p = req.pingju as { name: string; shoupai: string[] }
  return (
    <div className="play-result" role="dialog" aria-label="局の結果">
      <h2 className="play-result-title">流局</h2>
      <ul className="play-result-yaku">
        {[0, 1, 2, 3].map((l) => (
          <li key={l}>
            {nameOf(l)}:{p.shoupai[l] ? 'テンパイ' : 'ノーテン'}
          </li>
        ))}
      </ul>
      <button type="button" className="button button--primary button--block" onClick={next}>
        次へ
      </button>
    </div>
  )
}

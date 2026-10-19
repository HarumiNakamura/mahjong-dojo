import { useSyncExternalStore } from 'react'
import { Link } from '../../app/Link'
import { Hand } from '../../components/tile/Hand'
import { handView } from '../../game/convert'
import { huleDetail, type HuleMessage } from '../../game/huleDetail'
import { formatPoints } from '../../game/result'
import { PLAYER_NAMES, type GameSession } from '../../game/session'
import { MeldTiles } from './PlayTable'

const WINDS = ['東', '南', '西', '北']

const signed = (n: number) => (n > 0 ? `+${n.toLocaleString('ja-JP')}` : n < 0 ? `−${(-n).toLocaleString('ja-JP')}` : '±0')

/** 点数の動き(局の前・増減・局の後) */
function ScoreMoves({ before, fenpei, nameOf }: { before: number[]; fenpei: readonly number[]; nameOf: (l: number) => string }) {
  return (
    <table className="play-result-table play-result-moves">
      <thead>
        <tr>
          <th scope="col">席</th>
          <th scope="col">局の前</th>
          <th scope="col">増減</th>
          <th scope="col">局の後</th>
        </tr>
      </thead>
      <tbody>
        {[0, 1, 2, 3].map((l) => (
          <tr key={l} className={nameOf(l) === PLAYER_NAMES[0] ? 'play-result-me' : ''}>
            <td>
              {WINDS[l]} {nameOf(l)}
            </td>
            <td>{before[l].toLocaleString('ja-JP')}</td>
            <td className={fenpei[l] > 0 ? 'play-plus' : fenpei[l] < 0 ? 'play-minus' : ''}>{signed(fenpei[l])}</td>
            <td>{(before[l] + fenpei[l]).toLocaleString('ja-JP')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** 局の結果(アガリ・流局)と半荘の結果。次へ進むボタンつき */
export function PlayResult({ session, onRestart }: { session: GameSession; onRestart: () => void }) {
  const { human } = session
  // 局の結果は盤面と別の部品なので、ここでも変化を受け取って描き直す
  useSyncExternalStore(
    (fn) => human.subscribe(fn),
    () => human.version,
  )
  const req = human.request
  const model = human.model
  if (!req || (req.kind !== 'hule' && req.kind !== 'pingju' && req.kind !== 'jieju')) return null
  const next = () => human.reply({})
  const nameOf = (l: number) => PLAYER_NAMES[model.player_id[l]]
  // 局の結果を出している間、持ち点はまだ動いていない(「次へ」で動く)
  const before = [0, 1, 2, 3].map((l) => model.defen[model.player_id[l]])

  if (req.kind === 'jieju') {
    const final = session.game.final
    const order = [0, 1, 2, 3].sort((a, b) => (final ? final.ranks[a] - final.ranks[b] || a - b : 0))
    return (
      <div className="play-result" role="dialog" aria-label="半荘の結果">
        <h2 className="play-result-title">半荘終了</h2>
        {final && (
          <>
            <table className="play-result-table">
              <thead>
                <tr>
                  <th scope="col">順位</th>
                  <th scope="col">名前</th>
                  <th scope="col">持ち点</th>
                  <th scope="col">ポイント</th>
                </tr>
              </thead>
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
            <p className="play-result-note">
              ポイント =(持ち点 − 30,000点)÷ 1,000 + 順位点(1位 +50・2位 +10・3位 −10・4位 −30)。同じ点数のときは順位点を等分します。
            </p>
          </>
        )}
        <p className="play-result-note">
          成績は<Link to="/records">学習記録</Link>に保存しました。
        </p>
        <button type="button" className="button button--primary button--block" onClick={onRestart}>
          もう一度対局する
        </button>
      </div>
    )
  }

  if (req.kind === 'hule') {
    const h = req.hule as unknown as HuleMessage
    const v = handView(h.shoupai)
    const melds = h.shoupai.split(',').slice(1).filter(Boolean)
    const detail = huleDetail(h, model.zhuangfeng, model.shan.baopai)
    const yaku = detail
      ? [
          ...detail.yakuman.map((y) => ({ name: y.name, value: '役満' })),
          ...detail.yaku.map((y) => ({ name: y.name, value: `${y.han}翻` })),
          ...detail.dora.map((y) => ({ name: y.name, value: `${y.han}翻` })),
        ]
      : h.hupai.map((y) => ({ name: y.name, value: typeof y.fanshu === 'number' ? `${y.fanshu}翻` : '役満' }))
    return (
      <div className="play-result" role="dialog" aria-label="局の結果">
        <h2 className="play-result-title">
          {nameOf(h.l)}({WINDS[h.l]})の{h.baojia === null ? 'ツモ' : 'ロン'}
          {h.baojia !== null && <span className="play-result-sub">({nameOf(h.baojia)}から)</span>}
        </h2>
        <div className="play-result-hand">
          <Hand tiles={v.tiles} drawn={v.drawn} />
          {melds.length > 0 && (
            <div className="play-my-melds">
              {melds.map((m, i) => (
                <MeldTiles key={i} m={m} size="small" />
              ))}
            </div>
          )}
        </div>
        <table className="play-result-table">
          <caption>役</caption>
          <tbody>
            {yaku.map((y) => (
              <tr key={y.name}>
                <td>{y.name}</td>
                <td>{y.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {detail && detail.yakuman.length === 0 && detail.fuItems.length > 0 && (
          <details className="play-result-fu">
            <summary>符の内訳({detail.fu}符)</summary>
            <table className="play-result-table">
              <tbody>
                {detail.fuItems.map((f, i) => (
                  <tr key={i}>
                    <td>{f.label}</td>
                    <td>{f.fu}符</td>
                  </tr>
                ))}
                <tr>
                  <td>合計</td>
                  <td>{detail.fuRaw === detail.fu ? `${detail.fu}符` : `${detail.fuRaw}符 → 切り上げて${detail.fu}符`}</td>
                </tr>
              </tbody>
            </table>
          </details>
        )}
        <p className="play-result-points">
          {detail ? detail.label : h.fu ? `${h.fu}符${h.fanshu}翻` : ''} {h.defen.toLocaleString('ja-JP')}点
        </p>
        {(model.changbang > 0 || model.lizhibang > 0) && (
          <p className="play-result-note">
            {model.changbang > 0 && `${model.changbang}本場(${(model.changbang * 300).toLocaleString('ja-JP')}点)`}
            {model.changbang > 0 && model.lizhibang > 0 && '・'}
            {model.lizhibang > 0 && `供託 ${model.lizhibang}本(${(model.lizhibang * 1000).toLocaleString('ja-JP')}点)`}
            もアガった人が受け取ります。
          </p>
        )}
        <ScoreMoves before={before} fenpei={h.fenpei} nameOf={nameOf} />
        <button type="button" className="button button--primary button--block" onClick={next}>
          次へ
        </button>
      </div>
    )
  }

  const p = req.pingju as { name: string; shoupai: string[]; fenpei: number[] }
  const tenpai = p.shoupai.filter(Boolean).length
  return (
    <div className="play-result" role="dialog" aria-label="局の結果">
      <h2 className="play-result-title">流局</h2>
      <table className="play-result-table">
        <tbody>
          {[0, 1, 2, 3].map((l) => {
            const v = p.shoupai[l] ? handView(p.shoupai[l]) : null
            return (
              <tr key={l}>
                <td>
                  {WINDS[l]} {nameOf(l)}
                </td>
                <td>
                  {v ? (
                    <>
                      テンパイ
                      <div className="play-result-hand play-result-hand--small">
                        <Hand tiles={v.drawn ? [...v.tiles, v.drawn] : v.tiles} />
                      </div>
                    </>
                  ) : (
                    'ノーテン'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="play-result-note">
        {tenpai === 0 || tenpai === 4
          ? '全員テンパイ、または全員ノーテンなので、ノーテン罰符の支払いはありません。'
          : `ノーテン罰符:ノーテンの人が合わせて3,000点を、テンパイの人(${tenpai}人)に払います。`}
        {p.shoupai[0] ? '親がテンパイなので連荘します。' : '親がノーテンなので親が流れます。'}
      </p>
      <ScoreMoves before={before} fenpei={p.fenpei} nameOf={nameOf} />
      <button type="button" className="button button--primary button--block" onClick={next}>
        次へ
      </button>
    </div>
  )
}

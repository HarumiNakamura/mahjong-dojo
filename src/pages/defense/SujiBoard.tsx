import { Tile } from '../../components/tile/Tile'
import { assessForPlayer, genbutsuOf, SEAT_NAMES, visibleCounts, type DefenseSituation } from '../../engine/danger'
import { CATEGORY_SHORT, dangerLevel } from './defenseUi'
import { kindOf, type Suit } from '../../engine/tiles'

interface Props {
  situation: DefenseSituation
  seat: number
  /** 目立たせる牌の種類 */
  focus?: number | null
}

const SUITS: Suit[] = ['m', 'p', 's']

/**
 * スジ表: リーチ者1人に対する、1〜9 と字牌の安全度。
 * 現物から3つ離れた牌(スジ)へ線を引き、4枚見えている牌(壁)には「壁」と書く。
 */
export function SujiBoard({ situation: s, seat, focus = null }: Props) {
  const visible = visibleCounts(s)
  const genbutsu = genbutsuOf(s, seat)
  return (
    <div className="suji-board">
      <p className="suji-board-title">{SEAT_NAMES[seat]}のリーチに対する安全度</p>
      {SUITS.map((suit) => {
        const kinds = Array.from({ length: 9 }, (_, i) => kindOf(suit, i + 1))
        // スジの線: 現物の牌から ±3 の牌へ
        const arcs: [number, number][] = []
        kinds.forEach((k, i) => {
          if (!genbutsu.has(k)) return
          if (i - 3 >= 0) arcs.push([i - 3, i])
          if (i + 3 <= 8) arcs.push([i, i + 3])
        })
        const uniqueArcs = [...new Map(arcs.map((a) => [a.join('-'), a])).values()]
        return (
          <div key={suit} className="suji-row">
            <svg className="suji-arcs" viewBox="0 0 90 12" preserveAspectRatio="none" aria-hidden="true">
              {uniqueArcs.map(([a, b]) => {
                const x1 = a * 10 + 5
                const x2 = b * 10 + 5
                return <path key={`${a}-${b}`} d={`M ${x1} 12 Q ${(x1 + x2) / 2} -4 ${x2} 12`} className="suji-arc" />
              })}
            </svg>
            <div className="suji-cells">
              {kinds.map((k) => {
                const a = assessForPlayer(s, seat, k, visible)
                const wall = visible[k] >= 4
                return (
                  <div
                    key={k}
                    className={`suji-cell suji-cell--${dangerLevel(a.danger)}${focus === k ? ' suji-cell--focus' : ''}`}
                    title={`${a.label} ${a.danger}%`}
                  >
                    <Tile tile={{ kind: k, red: false }} showLabel={false} />
                    <span className="suji-cell-cat">{wall ? '壁' : CATEGORY_SHORT[a.category]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="suji-cells suji-cells--honors">
        {Array.from({ length: 7 }, (_, i) => 27 + i).map((k) => {
          const a = assessForPlayer(s, seat, k, visible)
          return (
            <div key={k} className={`suji-cell suji-cell--${dangerLevel(a.danger)}${focus === k ? ' suji-cell--focus' : ''}`}>
              <Tile tile={{ kind: k, red: false }} showLabel={false} />
              <span className="suji-cell-cat">{a.category === 'genbutsu' ? '現' : `${Math.min(3, visible[k])}枚`}</span>
            </div>
          )
        })}
      </div>
      <p className="suji-legend">
        現=現物 ス=スジ 両=両スジ 宣=宣言牌のスジ 片=片スジ ノ=ノーチャンス ワ=ワンチャンス 無=無スジ 壁=4枚見えている牌。
        字牌の数字は見えている枚数。線は現物からスジへのつながり。色が濃いほど危険です。
      </p>
    </div>
  )
}

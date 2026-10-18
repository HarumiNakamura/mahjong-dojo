// 押し引きの概算に使う目安の数値
//
// よく知られた統計(リーチを受けたときのアガリ率・放銃率・平均打点)をもとにした概算。
// 考え方は docs/pushfold.md を参照。数値を直すときはこのファイルだけを変える。

/** 巡目の区切り(序盤 〜6巡目・中盤 7〜12巡目・終盤 13巡目〜) */
export type TurnBand = 'early' | 'mid' | 'late'

export function turnBand(turn: number): TurnBand {
  if (turn <= 6) return 'early'
  if (turn <= 12) return 'mid'
  return 'late'
}

export const PUSHFOLD_TABLE = {
  /**
   * 押したときのアガリ率(%)。リーチ者と勝負する場合。
   * テンパイ・イーシャンテン × 良形・愚形 × 巡目
   */
  winRate: {
    tenpai: {
      good: { early: 52, mid: 45, late: 32 },
      bad: { early: 38, mid: 32, late: 22 },
    },
    iishanten: {
      good: { early: 26, mid: 20, late: 10 },
      bad: { early: 14, mid: 10, late: 5 },
    },
  },
  /** 残り枚数による補正(テンパイは待ち牌の残り、イーシャンテンは受け入れ枚数) */
  countFactor: {
    tenpai: [
      { min: 6, factor: 1.0 },
      { min: 4, factor: 0.85 },
      { min: 2, factor: 0.65 },
      { min: 0, factor: 0.4 },
    ],
    iishanten: [
      { min: 20, factor: 1.0 },
      { min: 12, factor: 0.85 },
      { min: 0, factor: 0.7 },
    ],
  },
  /** イーシャンテンを良形とみなす受け入れ枚数 */
  iishantenGoodUkeire: 20,
  /**
   * この1枚のあとも押し続けたときに、さらに放銃する率(%)。
   * テンパイならツモ切りが中心、イーシャンテンは不要牌がまだ出るので高い
   */
  futureDealIn: {
    tenpai: { early: 10, mid: 8, late: 5 },
    iishanten: { early: 16, mid: 13, late: 8 },
  },
  /** 相手の平均打点(ロン、点) */
  opponentValue: {
    riichi: { dealer: 10500, nonDealer: 7000 },
    call: { dealer: 6800, nonDealer: 4500 },
    dama: { dealer: 7500, nonDealer: 5000 },
  },
  /** 降りたとき、リーチ者がツモアガリする率(%) */
  opponentTsumo: { early: 30, mid: 25, late: 15 },
  /** 押しと降りの差がこの点数より小さければ、どちらも正解 */
  closeMargin: 300,
} as const

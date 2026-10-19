// 振り返りの結果の型

/** 指摘の分類 */
export type FindingCategory = 'discard' | 'pushfold' | 'dealin' | 'call' | 'missedWin' | 'riichi'

export const CATEGORY_NAMES: Record<FindingCategory, string> = {
  discard: '打牌(牌効率)',
  pushfold: '押し引き',
  dealin: '放銃',
  call: '鳴き',
  missedWin: 'アガリ逃し',
  riichi: 'リーチ判断',
}

export const CATEGORIES = Object.keys(CATEGORY_NAMES) as FindingCategory[]

export interface Finding {
  category: FindingCategory
  /** 細かい種類(例: 'ukeire'・'shanten'・'overpush'・'overfold'・'noYaku'・'missedRon') */
  kind: string
  /** 判断した場面(牌譜の局と手数。この手数の盤面で判断した) */
  kyoku: number
  step: number
  /** 損失の目安(点) */
  loss: number
  /** 見出し(例: 「受け入れの少ない打牌」) */
  title: string
  /** あなたの選択(例: 「5萬を切った」) */
  played: string
  /** よりよい選択(例: 「1索を切る(受け入れ 32枚)」) */
  better: string
  /** 理由(テンプレートで作った文) */
  reason: string
}

export interface GameReview {
  /** 指摘(場面の順) */
  findings: Finding[]
  /** 分類ごとの数 */
  counts: Record<FindingCategory, number>
  /** 損失の合計の目安(点) */
  totalLoss: number
  /** 分かれ目(損失の大きい順に最大3つ) */
  turningPoints: Finding[]
  /** 調べた自分の打牌の数 */
  decisions: number
}

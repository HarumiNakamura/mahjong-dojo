// 振り返りの一言まとめ(テンプレート)

import { CATEGORIES, CATEGORY_NAMES, type FindingCategory, type GameReview } from './types'

const yen = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}点`

/** 指摘の多い順の分類(同じ数なら損失の大きい順) */
export function rankedCategories(review: GameReview): FindingCategory[] {
  const loss = (c: FindingCategory) => review.findings.filter((f) => f.category === c).reduce((a, f) => a + f.loss, 0)
  return CATEGORIES.filter((c) => review.counts[c] > 0).sort((a, b) => review.counts[b] - review.counts[a] || loss(b) - loss(a))
}

/**
 * 一言まとめ。kyokuLabel は局の番号から「東2局 0本場」のような表示を作る
 * 例: 「分かれ目は東3局の押しすぎ(約2,300点)。押し引きの指摘が3回ありました。」
 */
export function summaryLine(review: GameReview, kyokuLabel: (kyoku: number) => string): string {
  if (review.findings.length === 0) return '大きな判断ミスは見つかりませんでした。この調子で打ちましょう。'
  const top = review.turningPoints[0]
  const cat = rankedCategories(review)[0]
  const head = top ? `分かれ目は${kyokuLabel(top.kyoku).replace(/ 0本場$/, '')}の${top.title}(約${yen(top.loss)})。` : ''
  return `${head}${CATEGORY_NAMES[cat]}の指摘が${review.counts[cat]}回ありました。`
}

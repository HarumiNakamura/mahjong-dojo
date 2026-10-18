// 点数早見表(Mリーグルール版: 切り上げ満貫あり・数え役満なし)

import { isKiriageMangan, LIMIT_LABELS, pointsFor, type LimitName } from './scoring'

export const TABLE_FU = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const
export const TABLE_HAN = [1, 2, 3, 4] as const

export interface TableCell {
  /** ロンの点数(ありえない組み合わせは null) */
  ron: number | null
  /** ツモの支払い(ありえない組み合わせは null)。親のアガリは fromDealer が null */
  tsumo: { fromDealer: number | null; fromNonDealer: number } | null
  /** 満貫以上になっていれば区分 */
  limit: LimitName | null
  /** 切り上げ満貫で満貫になった */
  kiriage: boolean
}

/**
 * ありえない組み合わせ:
 * - 20符はピンフのツモだけ(ロンなし、1翻なし)
 * - 25符は七対子だけ(2翻以上。ツモは門前清自摸和が付くので3翻以上)
 */
function possible(fu: number, han: number, tsumo: boolean): boolean {
  if (fu === 20) return tsumo && han >= 2
  if (fu === 25) return tsumo ? han >= 3 : han >= 2
  return true
}

export function tableCell(fu: number, han: number, dealer: boolean): TableCell {
  const p = pointsFor(han, fu, dealer)
  return {
    ron: possible(fu, han, false) ? p.ron : null,
    tsumo: possible(fu, han, true) ? p.tsumo : null,
    limit: p.limit,
    kiriage: isKiriageMangan(han, fu),
  }
}

export interface LimitRow {
  limit: LimitName
  label: string
  /** 翻数の目安 */
  hanLabel: string
  ron: number
  tsumo: { fromDealer: number | null; fromNonDealer: number }
}

/** 満貫以上の表 */
export function limitRows(dealer: boolean): LimitRow[] {
  const rows: [LimitName, string, number, number][] = [
    ['mangan', '5翻(4翻・3翻でも符によっては満貫)', 5, 0],
    ['haneman', '6〜7翻', 6, 0],
    ['baiman', '8〜10翻', 8, 0],
    ['sanbaiman', '11翻以上(13翻以上も三倍満)', 11, 0],
    ['yakuman', '役満の役', 0, 1],
  ]
  return rows.map(([limit, hanLabel, han, yakuman]) => {
    const p = pointsFor(han, 30, dealer, yakuman)
    return { limit, label: LIMIT_LABELS[limit], hanLabel, ron: p.ron, tsumo: p.tsumo }
  })
}

/** ツモの支払いを「300/500」「700オール」のように書く */
export function formatTsumo(t: { fromDealer: number | null; fromNonDealer: number }): string {
  const f = (n: number) => n.toLocaleString('ja-JP')
  return t.fromDealer === null ? `${f(t.fromNonDealer)}オール` : `${f(t.fromNonDealer)}/${f(t.fromDealer)}`
}

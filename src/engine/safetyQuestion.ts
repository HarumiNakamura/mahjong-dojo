// 安パイ並べドリルの問題作りと判定
//
// 他家がリーチしている局面で、自分の手牌14枚を安全な順に並べる(かんたんモードは一番安全な1枚を選ぶ)。
// 安全度は danger.ts の判定を使い、危険度が同じ牌どうしの順番は問わない。
//
// 段階:
//   初級 … リーチ者1人。手牌に現物がある
//   中級 … リーチ者1人。手牌の現物は1種類まで。スジ・壁(ノーチャンス)の牌が2種類以上ある
//   上級 … リーチ者2人

import {
  assessHand,
  dangerGroups,
  generateSituation,
  situationFromData,
  situationToData,
  type DefenseSituation,
  type SituationData,
  type TileSafety,
} from './danger'
import type { Rng } from './random'
import type { Tile } from './tiles'

export type SafetyLevel = 'beginner' | 'intermediate' | 'advanced'
/** order = 14枚を並べる、pick = 一番安全な1枚を選ぶ(かんたん) */
export type SafetyMode = 'order' | 'pick'

export const SAFETY_LEVELS: readonly { id: SafetyLevel; label: string; description: string }[] = [
  { id: 'beginner', label: '初級', description: '相手1人のリーチ。手牌に現物(相手が切った牌)があります。' },
  { id: 'intermediate', label: '中級', description: '相手1人のリーチ。現物が少ないので、スジや壁を手がかりにします。' },
  { id: 'advanced', label: '上級', description: '相手2人のリーチ。両方に安全な牌を探します。' },
]

export interface SafetyQuestion {
  level: SafetyLevel
  mode: SafetyMode
  situation: DefenseSituation
  /** 自分の手牌14枚(ツモ牌を含む) */
  tiles: Tile[]
  /** 牌の種類ごとの判定(安全な順) */
  assessments: TileSafety[]
  /** 牌の種類 → 危険度のグループ(0 が一番安全) */
  groups: Map<number, number>
}

/** 回答: 並べた順の牌の種類(14個)。かんたんモードは選んだ1種類 */
export type SafetyAnswer = number[]

export interface SafetyQuestionData {
  level: SafetyLevel
  mode: SafetyMode
  situation: SituationData
}

export function buildSafetyQuestion(level: SafetyLevel, mode: SafetyMode, situation: DefenseSituation): SafetyQuestion {
  const assessments = assessHand(situation)
  return {
    level,
    mode,
    situation,
    tiles: [...situation.myHand, situation.drawn],
    assessments,
    groups: dangerGroups(assessments),
  }
}

function fitsLevel(level: SafetyLevel, q: SafetyQuestion): boolean {
  const cats = q.assessments.map((a) => a.perPlayer[0].category)
  // 全部同じ危険度だと並べる意味がない
  if (new Set(q.assessments.map((a) => a.danger)).size < 3) return false
  if (level === 'beginner') return cats.includes('genbutsu')
  if (level === 'intermediate') {
    const sujiOrWall = cats.filter((c) => c === 'suji' || c === 'ryousuji' || c === 'sengenSuji' || c === 'noChance').length
    return cats.filter((c) => c === 'genbutsu').length <= 1 && sujiOrWall >= 2
  }
  return true
}

export function generateSafetyQuestion(level: SafetyLevel, mode: SafetyMode, rng: Rng, maxAttempts = 200): SafetyQuestion {
  const riichiCount = level === 'advanced' ? 2 : 1
  for (let i = 0; i < maxAttempts; i++) {
    const s = generateSituation(rng, { riichiCount, minTurnsAfterRiichi: 1 + Math.floor(rng() * 3) })
    const q = buildSafetyQuestion(level, mode, s)
    if (fitsLevel(level, q)) return q
  }
  throw new Error('安パイ並べの問題を作れませんでした')
}

// ---- 判定 ----

/** 一番安全な牌の種類(危険度が同じなら複数) */
export function safestKinds(q: SafetyQuestion): number[] {
  return q.assessments.filter((a) => q.groups.get(a.kind) === 0).map((a) => a.kind)
}

/**
 * 並べた順の、位置ごとの正誤。
 * 安全な順になっている一番長い並び(危険度のグループが下がらない部分列)に入っている牌を ○ とし、
 * それ以外(順番を崩している牌)を × とする。1枚だけ動かし間違えたときは、その1枚だけが × になる。
 */
export function orderMarks(q: SafetyQuestion, kinds: readonly number[]): boolean[] {
  const g = kinds.map((k) => q.groups.get(k) ?? Infinity)
  const len = g.map(() => 1)
  const prev = g.map(() => -1)
  for (let i = 0; i < g.length; i++) {
    for (let j = 0; j < i; j++) {
      if (g[j] <= g[i] && len[j] + 1 > len[i]) {
        len[i] = len[j] + 1
        prev[i] = j
      }
    }
  }
  const marks = g.map(() => false)
  let i = len.length > 0 ? len.indexOf(Math.max(...len)) : -1
  while (i >= 0) {
    marks[i] = true
    i = prev[i]
  }
  return marks
}

function sameTiles(q: SafetyQuestion, kinds: readonly number[]): boolean {
  const a = [...kinds].sort((x, y) => x - y)
  const b = q.tiles.map((t) => t.kind).sort((x, y) => x - y)
  return a.length === b.length && a.every((k, i) => k === b[i])
}

export function judgeSafety(q: SafetyQuestion, answer: SafetyAnswer): boolean {
  if (q.mode === 'pick') return answer.length === 1 && safestKinds(q).includes(answer[0])
  return sameTiles(q, answer) && orderMarks(q, answer).every(Boolean)
}

// ---- 保存と復元 ----

export function toSafetyData(q: SafetyQuestion): SafetyQuestionData {
  return { level: q.level, mode: q.mode, situation: situationToData(q.situation) }
}

export function fromSafetyData(value: unknown): SafetyQuestion {
  const d = value as Partial<SafetyQuestionData> | null
  if (!d || !SAFETY_LEVELS.some((l) => l.id === d.level) || (d.mode !== 'order' && d.mode !== 'pick')) {
    throw new Error('安パイ並べの問題データが正しくありません')
  }
  return buildSafetyQuestion(d.level!, d.mode, situationFromData(d.situation))
}

export function safetyKeyOf(q: SafetyQuestion): string {
  const s = situationToData(q.situation)
  return [q.mode, s.hand, s.drawn, s.rivers.join(','), s.seq, s.riichi.join(',')].join('|')
}

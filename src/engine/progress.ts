// 学習の進み具合(ロードマップ・弱点マップ・今日の練習・連続日数)
//
// すべて学習記録(回答の一覧)から計算する。記録が0件でも動く。

import { createRng, shuffle } from './random'
import { localDate, type AttemptRecord, type GameRecord } from './records'

// ---- 分野 ----

export interface Area {
  id: string
  label: string
  /** この分野に入るドリルの id */
  drills: string[]
  /** 練習するページ */
  path: string
}

/** 弱点マップの分野 */
export const AREAS: readonly Area[] = [
  { id: 'waits', label: '待ち', drills: ['waits'], path: '/practice/waits' },
  { id: 'score', label: '役・点数', drills: ['score'], path: '/practice/score' },
  { id: 'efficiency', label: '牌効率', drills: ['efficiency'], path: '/practice/efficiency' },
  { id: 'defense', label: '守備', drills: ['safety', 'betaori'], path: '/practice/defense' },
  { id: 'pushfold', label: '押し引き', drills: ['pushfold'], path: '/practice/judgment/pushfold' },
  { id: 'call', label: '鳴き', drills: ['call'], path: '/practice/judgment/call' },
  { id: 'plan', label: '配牌方針', drills: ['plan'], path: '/practice/judgment/plan' },
]

/** 正解率を出すのに使う、分野ごとの最近の回答数 */
export const RECENT_PER_AREA = 50
/** 正解率を信用する最低の回答数(これより少ないと「記録が少ない」) */
export const MIN_ANSWERS = 5

export interface AreaStats {
  area: Area
  /** 最近の回答数(最大 RECENT_PER_AREA) */
  answered: number
  correct: number
  /** 正解率(%)。回答がなければ null */
  rate: number | null
}

export function areaStats(attempts: readonly AttemptRecord[]): AreaStats[] {
  return AREAS.map((area) => {
    const mine = attempts
      .filter((a) => area.drills.includes(a.drill))
      .sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))
      .slice(-RECENT_PER_AREA)
    const correct = mine.filter((a) => a.correct).length
    return { area, answered: mine.length, correct, rate: mine.length ? Math.round((correct / mine.length) * 100) : null }
  })
}

// ---- CPU対戦の振り返り ----

/** 振り返りの分類(src/review/types.ts)と、弱点マップの分野の対応 */
export const REVIEW_CATEGORY_AREAS: Record<string, string> = {
  discard: 'efficiency',
  pushfold: 'pushfold',
  dealin: 'defense',
  call: 'call',
  missedWin: 'waits',
  riichi: 'score',
}

/** 弱点に使う、振り返りをした最近の半荘の数 */
export const RECENT_REVIEWED_GAMES = 10
/** 1半荘あたりの指摘がこの回数以上なら、おすすめに出す */
export const GAME_WEAK_PER_GAME = 1

export interface GameAreaStats {
  area: Area
  /** 振り返りをした半荘の数(最大 RECENT_REVIEWED_GAMES) */
  games: number
  /** 1半荘あたりの指摘の数(小数1桁。半荘がなければ null) */
  perGame: number | null
}

/** 分野ごとの、CPU対戦での1半荘あたりの指摘の数 */
export function gameAreaStats(games: readonly GameRecord[]): GameAreaStats[] {
  const reviewed = games
    .filter((g) => g.review)
    .sort((a, b) => a.playedAt.localeCompare(b.playedAt))
    .slice(-RECENT_REVIEWED_GAMES)
  return AREAS.map((area) => {
    const cats = Object.keys(REVIEW_CATEGORY_AREAS).filter((c) => REVIEW_CATEGORY_AREAS[c] === area.id)
    const total = reviewed.reduce((sum, g) => sum + cats.reduce((a, c) => a + (g.review!.counts[c] ?? 0), 0), 0)
    return { area, games: reviewed.length, perGame: reviewed.length ? Math.round((total / reviewed.length) * 10) / 10 : null }
  })
}

// ---- ロードマップ ----

export interface RoadmapStep {
  id: string
  label: string
  description: string
  areas: string[]
  /** 練習を始めるページ */
  path: string
}

export const ROADMAP: readonly RoadmapStep[] = [
  { id: 'basics', label: '役・待ち', description: '待ち牌を見つけ、役と点数の数え方に慣れる', areas: ['waits', 'score'], path: '/practice/waits' },
  { id: 'efficiency', label: '牌効率', description: '受け入れ枚数を比べて、早くテンパイする', areas: ['efficiency'], path: '/practice/efficiency' },
  { id: 'defense', label: '守備', description: '現物・スジ・壁で安全な牌を選ぶ', areas: ['defense'], path: '/practice/defense' },
  {
    id: 'judgment',
    label: '押し引き・鳴き・配牌方針',
    description: '押すか降りるか、鳴くか、どの手を目指すかを判断する',
    areas: ['pushfold', 'call', 'plan'],
    path: '/practice/judgment',
  },
]

/** ステップをクリアする条件: 分野ごとに CLEAR_ANSWERS 問以上、正解率 CLEAR_RATE% 以上 */
export const CLEAR_ANSWERS = 20
export const CLEAR_RATE = 70

export type StepStatus = 'notStarted' | 'inProgress' | 'cleared'

export interface RoadmapProgress {
  step: RoadmapStep
  status: StepStatus
  /** 進み具合(0〜100)。分野ごとの「回答数の達成度」と「正解率の達成度」の平均 */
  percent: number
}

export function roadmapProgress(attempts: readonly AttemptRecord[]): RoadmapProgress[] {
  const stats = areaStats(attempts)
  return ROADMAP.map((step) => {
    const mine = stats.filter((s) => step.areas.includes(s.area.id))
    const parts = mine.map((s) => {
      const count = Math.min(1, s.answered / CLEAR_ANSWERS)
      const rate = s.rate === null ? 0 : Math.min(1, s.rate / CLEAR_RATE)
      return (count + count * rate) / 2
    })
    const percent = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
    const cleared = mine.every((s) => s.answered >= CLEAR_ANSWERS && (s.rate ?? 0) >= CLEAR_RATE)
    const started = mine.some((s) => s.answered > 0)
    return { step, status: cleared ? 'cleared' : started ? 'inProgress' : 'notStarted', percent: cleared ? 100 : percent }
  })
}

// ---- おすすめ ----

export interface Recommendation {
  area: Area
  reason: string
}

/**
 * 次におすすめの練習。
 * 1. 記録が十分ある分野のうち、正解率が CLEAR_RATE% 未満で一番低い分野
 * 2. CPU対戦の振り返りで、1半荘あたりの指摘が GAME_WEAK_PER_GAME 回以上で一番多い分野
 * 3. ロードマップでまだクリアしていない最初のステップ
 */
export function recommend(attempts: readonly AttemptRecord[], games: readonly GameRecord[] = []): Recommendation {
  const stats = areaStats(attempts).filter((s) => s.answered >= MIN_ANSWERS)
  if (stats.length > 0) {
    const weakest = [...stats].sort((a, b) => a.rate! - b.rate! || a.answered - b.answered)[0]
    if (weakest.rate! < CLEAR_RATE) return { area: weakest.area, reason: `正解率が${weakest.rate}%と一番低い分野です。` }
  }
  const fromGames = gameAreaStats(games)
    .filter((g) => g.perGame !== null && g.perGame >= GAME_WEAK_PER_GAME)
    .sort((a, b) => b.perGame! - a.perGame!)[0]
  if (fromGames) return { area: fromGames.area, reason: `CPU対戦の振り返りで、1半荘あたり${fromGames.perGame}回の指摘があった分野です。` }
  const progress = roadmapProgress(attempts)
  const next = progress.find((p) => p.status !== 'cleared') ?? progress[progress.length - 1]
  const all = areaStats(attempts)
  const areaId = next.step.areas.find((id) => (all.find((s) => s.area.id === id)?.answered ?? 0) < CLEAR_ANSWERS) ?? next.step.areas[0]
  const area = AREAS.find((a) => a.id === areaId)!
  return { area, reason: `ロードマップの「${next.step.label}」の練習です。` }
}

// ---- 連続日数 ----

/** 今日(まだなら昨日)から何日続けて練習したか */
export function streakDays(attempts: readonly AttemptRecord[], now: Date): number {
  const days = new Set(attempts.map((a) => localDate(new Date(a.answeredAt))))
  const day = (offset: number) => localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset))
  let start = days.has(day(0)) ? 0 : days.has(day(1)) ? 1 : -1
  if (start < 0) return 0
  let n = 0
  while (days.has(day(start + n))) n++
  return n
}

// ---- 今日の練習 ----

/** 今日の練習で出すドリル(この中から日付で5つ選ぶ) */
export const DAILY_DRILLS = ['efficiency', 'waits', 'score', 'safety', 'pushfold', 'call', 'plan'] as const
export type DailyDrill = (typeof DAILY_DRILLS)[number]
export const DAILY_COUNT = 5

/** 日付(YYYY-MM-DD)から決まる数 */
export function dateSeed(date: string): number {
  let h = 2166136261
  for (const c of date) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h
}

/** 今日の5問のドリルと、それぞれの問題のシード */
export function dailyPlan(date: string): { drill: DailyDrill; seed: number }[] {
  const rng = createRng(dateSeed(date))
  return shuffle([...DAILY_DRILLS], rng)
    .slice(0, DAILY_COUNT)
    .map((drill) => ({ drill, seed: Math.floor(rng() * 2 ** 31) }))
}

/** 今日の練習のキーの一覧(`${ドリル}\n${問題のキー}`)のうち、その日に答えた問題の数 */
export function countDailyDone(keys: readonly string[], attempts: readonly AttemptRecord[], date: string): number {
  const answered = new Set(
    attempts.filter((a) => localDate(new Date(a.answeredAt)) === date).map((a) => `${a.drill}\n${a.questionKey}`),
  )
  return keys.filter((k) => answered.has(k)).length
}

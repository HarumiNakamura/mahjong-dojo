// 今日の練習: 日付で決まる5問(いろいろなドリルから1問ずつ)

import { generateCallQuestion } from '../engine/callQuestion'
import { generateQuestion } from '../engine/efficiencyQuestion'
import { generatePlanQuestion } from '../engine/planQuestion'
import { dailyPlan, type DailyDrill } from '../engine/progress'
import { generatePushFoldQuestion } from '../engine/pushfoldQuestion'
import { createRng, type Rng } from '../engine/random'
import type { AttemptRecord } from '../engine/records'
import { generateSafetyQuestion } from '../engine/safetyQuestion'
import { generateScoreQuestion } from '../engine/scoreQuestion'
import { generateWaitsQuestion } from '../engine/waitsQuestion'
import { localDate } from '../engine/records'
import { findDrill } from './registry'
import type { AnyDrillDefinition } from './types'

export interface DailyItem {
  definition: AnyDrillDefinition
  question: unknown
  key: string
}

const GENERATORS: Record<DailyDrill, (rng: Rng) => unknown> = {
  efficiency: (rng) => generateQuestion('beginner', rng),
  waits: (rng) => generateWaitsQuestion(7, rng),
  score: (rng) => generateScoreQuestion('beginner', rng),
  safety: (rng) => generateSafetyQuestion('beginner', 'pick', rng),
  pushfold: (rng) => generatePushFoldQuestion(rng),
  call: (rng) => generateCallQuestion(rng),
  plan: (rng) => generatePlanQuestion(rng),
}

/** その日の5問を作る */
export function dailyItems(date: string): DailyItem[] {
  return dailyPlan(date).map(({ drill, seed }) => {
    const definition = findDrill(drill)!
    const question = GENERATORS[drill](createRng(seed))
    return { definition, question, key: definition.keyOf(question) }
  })
}

/** その日の5問のうち、その日に答えた問題の数 */
export function dailyDoneCount(items: readonly DailyItem[], attempts: readonly AttemptRecord[], date: string): number {
  const answered = new Set(
    attempts.filter((a) => localDate(new Date(a.answeredAt)) === date).map((a) => `${a.drill}\n${a.questionKey}`),
  )
  return items.filter((i) => answered.has(`${i.definition.id}\n${i.key}`)).length
}

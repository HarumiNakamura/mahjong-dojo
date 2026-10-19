// 今日の練習: 日付で決まる5問(いろいろなドリルから1問ずつ)

import { generateCallQuestion } from '../engine/callQuestion'
import { generateQuestion } from '../engine/efficiencyQuestion'
import { generatePlanQuestion } from '../engine/planQuestion'
import { countDailyDone, dailyPlan, type DailyDrill } from '../engine/progress'
import { generatePushFoldQuestion } from '../engine/pushfoldQuestion'
import { createRng, type Rng } from '../engine/random'
import type { AttemptRecord } from '../engine/records'
import { generateSafetyQuestion } from '../engine/safetyQuestion'
import { generateScoreQuestion } from '../engine/scoreQuestion'
import { generateWaitsQuestion } from '../engine/waitsQuestion'
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

/** 今日の練習の問題を見分けるキー(`${ドリル}\n${問題のキー}`) */
export const dailyKeyOf = (item: DailyItem) => `${item.definition.id}\n${item.key}`

/** その日の5問のうち、その日に答えた問題の数 */
export function dailyDoneCount(items: readonly DailyItem[], attempts: readonly AttemptRecord[], date: string): number {
  return countDailyDone(items.map(dailyKeyOf), attempts, date)
}

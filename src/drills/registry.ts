import { betaoriDrill } from './betaori'
import { callDrill } from './call'
import { efficiencyDrill } from './efficiency'
import { planDrill } from './plan'
import { pushFoldDrill } from './pushfold'
import { safetyDrill } from './safety'
import { scoreDrill } from './score'
import { waitsDrill } from './waits'
import type { AnyDrillDefinition } from './types'

/** 学習記録につながっているドリルの一覧(新しいドリルはここに追加する) */
export const DRILLS: readonly AnyDrillDefinition[] = [efficiencyDrill, waitsDrill, scoreDrill, safetyDrill, betaoriDrill, pushFoldDrill, planDrill, callDrill]

export function findDrill(id: string): AnyDrillDefinition | undefined {
  return DRILLS.find((d) => d.id === id)
}

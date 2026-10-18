import { betaoriDrill } from './betaori'
import { efficiencyDrill } from './efficiency'
import { pushFoldDrill } from './pushfold'
import { safetyDrill } from './safety'
import { scoreDrill } from './score'
import { waitsDrill } from './waits'
import type { AnyDrillDefinition } from './types'

/** 学習記録につながっているドリルの一覧(新しいドリルはここに追加する) */
export const DRILLS: readonly AnyDrillDefinition[] = [efficiencyDrill, waitsDrill, scoreDrill, safetyDrill, betaoriDrill, pushFoldDrill]

export function findDrill(id: string): AnyDrillDefinition | undefined {
  return DRILLS.find((d) => d.id === id)
}

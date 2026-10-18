import { efficiencyDrill } from './efficiency'
import type { AnyDrillDefinition } from './types'

/** 学習記録につながっているドリルの一覧(新しいドリルはここに追加する) */
export const DRILLS: readonly AnyDrillDefinition[] = [efficiencyDrill]

export function findDrill(id: string): AnyDrillDefinition | undefined {
  return DRILLS.find((d) => d.id === id)
}

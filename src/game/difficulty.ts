// CPU対戦の難易度と、それぞれの CPU
//
// やさしい: 受け入れ枚数が一番多い牌を切るだけ(守備・鳴きなし)。src/game/easyPlayer.ts
// ふつう: majiang-ai の古い版(legacy 0201)
// つよい: majiang-ai の最新版
// 強さの差は docs/cpu-stats.md(つよい CPU 1人 + その難易度の CPU 3人で 1,000半荘)

import AI from '@kobalab/majiang-ai'
import legacy from '@kobalab/majiang-ai/legacy'
import type { Player } from '@kobalab/majiang-core'
import { EasyPlayer } from './easyPlayer'

export type Difficulty = 'easy' | 'normal' | 'strong'

export const DIFFICULTIES: { id: Difficulty; label: string; description: string }[] = [
  { id: 'easy', label: 'やさしい', description: '牌効率だけで打ちます。守らず、鳴きません。' },
  { id: 'normal', label: 'ふつう', description: '守備や鳴きもする、少し古い CPU です。' },
  { id: 'strong', label: 'つよい', description: '押し引きも上手な、いちばん強い CPU です。' },
]

/** ふつうに使う majiang-ai の版 */
export const NORMAL_LEGACY_VERSION = '0201'

export function makeCpu(difficulty: string): () => Player {
  if (difficulty === 'easy') return () => new EasyPlayer()
  if (difficulty === 'normal') return () => new (legacy(NORMAL_LEGACY_VERSION))()
  if (difficulty === 'strong' || difficulty === 'latest') return () => new AI()
  return () => new (legacy(difficulty))()
}

export const isDifficulty = (v: unknown): v is Difficulty => v === 'easy' || v === 'normal' || v === 'strong'

export const difficultyLabel = (id: string) => DIFFICULTIES.find((d) => d.id === id)?.label ?? (id === 'latest' ? 'つよい' : id)

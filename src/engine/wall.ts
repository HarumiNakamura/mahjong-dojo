// 山(136枚)を作る
import { shuffle, type Rng } from './random'
import { RULES } from './rules'
import { ALL_KINDS, kindOf, type Tile } from './tiles'

/** 136枚の牌(赤5は rules.ts の枚数だけ普通の5と入れ替える) */
export function allTiles(): Tile[] {
  const tiles: Tile[] = []
  const reds: Record<number, number> = {
    [kindOf('m', 5)]: RULES.redFives.m,
    [kindOf('p', 5)]: RULES.redFives.p,
    [kindOf('s', 5)]: RULES.redFives.s,
  }
  for (const kind of ALL_KINDS) {
    for (let i = 0; i < 4; i++) tiles.push({ kind, red: i < (reds[kind] ?? 0) })
  }
  return tiles
}

/** かき混ぜた山 */
export function createWall(rng: Rng): Tile[] {
  return shuffle(allTiles(), rng)
}

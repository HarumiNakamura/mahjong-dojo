// シード付きの乱数(同じシードなら同じ並びになるので、テストや問題の再現に使える)

export type Rng = () => number

/** 0 以上 1 未満の乱数を返す関数を作る(mulberry32) */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 0 以上 n 未満の整数 */
export function randomInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n)
}

/** 配列をかき混ぜた新しい配列を返す */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

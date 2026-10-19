// 図解の寸法と、矢印の id
import { useId } from 'react'
import { TILE_H, TILE_W } from '../tile/TileArt'

/** 牌の幅に対する高さ */
export const TILE_RATIO = TILE_H / TILE_W

/** 並べた牌の幅 */
export const tilesWidth = (n: number, w = 36, gap = 0) => n * w + (n - 1) * gap

/** 図ごとの矢印の id(同じページに図が複数あっても重ならない) */
export function useArrowId(): { id: string; url: string } {
  const id = `fig-arrow-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  return { id, url: `url(#${id})` }
}

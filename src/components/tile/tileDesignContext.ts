import { createContext, useContext } from 'react'
import { DEFAULT_TILE_DESIGN, type TileDesignId } from './tileDesigns'

/** どのデザイン案で牌を描くか(/dev/tiles の比較用) */
export const TileDesignContext = createContext<TileDesignId>(DEFAULT_TILE_DESIGN)

export function useTileDesign(): TileDesignId {
  return useContext(TileDesignContext)
}

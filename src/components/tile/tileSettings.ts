import { createContext, useContext } from 'react'

export interface TileSettings {
  /** 牌の下に数字(例: 3萬)を小さく表示する */
  showLabel: boolean
}

export interface TileSettingsValue extends TileSettings {
  setShowLabel: (value: boolean) => void
}

export const DEFAULT_TILE_SETTINGS: TileSettings = { showLabel: false }

export const TileSettingsContext = createContext<TileSettingsValue>({
  ...DEFAULT_TILE_SETTINGS,
  setShowLabel: () => {},
})

export function useTileSettings(): TileSettingsValue {
  return useContext(TileSettingsContext)
}

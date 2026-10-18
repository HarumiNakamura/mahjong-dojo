import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_TILE_SETTINGS, TileSettingsContext, type TileSettings } from './tileSettings'

const STORAGE_KEY = 'mahjong-dojo:tile-settings'

function load(): TileSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_TILE_SETTINGS
    const saved = JSON.parse(raw) as Partial<TileSettings>
    return { showLabel: saved.showLabel === true }
  } catch {
    return DEFAULT_TILE_SETTINGS
  }
}

/** 牌の表示設定をブラウザ(localStorage)に保存して共有する */
export function TileSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TileSettings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // 保存できない環境(プライベートブラウズなど)では記憶しないだけにする
    }
  }, [settings])

  const value = useMemo(
    () => ({ ...settings, setShowLabel: (showLabel: boolean) => setSettings((s) => ({ ...s, showLabel })) }),
    [settings],
  )
  return <TileSettingsContext.Provider value={value}>{children}</TileSettingsContext.Provider>
}

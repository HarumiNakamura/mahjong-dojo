import type { ReactNode } from 'react'
import { usePath } from './app/router'
import { findComingSoonPage } from './app/routes'
import { Layout } from './components/layout/Layout'
import { TileSettingsProvider } from './components/tile/TileSettingsProvider'
import { AboutPage } from './pages/AboutPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DevDrillPage } from './pages/DevDrillPage'
import { DevTilesPage } from './pages/DevTilesPage'
import { EfficiencyDrillPage } from './pages/EfficiencyDrillPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PracticePage } from './pages/PracticePage'

/** パスに対応するページと題名 */
function resolvePage(path: string): { title?: string; element: ReactNode } {
  switch (path) {
    case '/':
      return { element: <HomePage /> }
    case '/practice':
      return { title: '練習', element: <PracticePage /> }
    case '/practice/efficiency':
      return { title: '何切る(牌効率)', element: <EfficiencyDrillPage /> }
    case '/about':
      return { title: 'このサイトについて', element: <AboutPage /> }
    case '/dev/tiles':
      return { title: '牌の表示確認', element: <DevTilesPage /> }
    case '/dev/drill':
      return { title: 'ドリル部品の確認', element: <DevDrillPage /> }
  }
  const soon = findComingSoonPage(path)
  if (soon) return { title: soon.title, element: <ComingSoonPage page={soon} /> }
  return { title: 'ページが見つかりません', element: <NotFoundPage /> }
}

function App() {
  const path = usePath()
  const { title, element } = resolvePage(path)
  return (
    <TileSettingsProvider>
      {/* key でページごとに状態をリセットする */}
      <Layout title={title}>
        <div key={path}>{element}</div>
      </Layout>
    </TileSettingsProvider>
  )
}

export default App

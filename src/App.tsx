import type { ReactNode } from 'react'
import { usePath } from './app/router'
import { findComingSoonPage } from './app/routes'
import { Layout } from './components/layout/Layout'
import { TileSettingsProvider } from './components/tile/TileSettingsProvider'
import { AboutPage } from './pages/AboutPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { CallPage } from './pages/CallPage'
import { DefenseDrillPage } from './pages/DefenseDrillPage'
import { DevDrillPage } from './pages/DevDrillPage'
import { DevTilesPage } from './pages/DevTilesPage'
import { EfficiencyDrillPage } from './pages/EfficiencyDrillPage'
import { HomePage } from './pages/HomePage'
import { JudgmentPage } from './pages/JudgmentPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlanPage } from './pages/PlanPage'
import { PracticePage } from './pages/PracticePage'
import { PushFoldPage } from './pages/PushFoldPage'
import { RecordsPage } from './pages/records/RecordsPage'
import { ScoreDrillPage } from './pages/ScoreDrillPage'
import { ScoreTablePage } from './pages/ScoreTablePage'
import { SoloPage } from './pages/SoloPage'
import { WaitsDrillPage } from './pages/WaitsDrillPage'
import { ReviewPage } from './pages/records/ReviewPage'

/** パスに対応するページと題名 */
function resolvePage(path: string): { title?: string; element: ReactNode } {
  switch (path) {
    case '/':
      return { element: <HomePage /> }
    case '/practice':
      return { title: '練習', element: <PracticePage /> }
    case '/practice/efficiency':
      return { title: '何切る(牌効率)', element: <EfficiencyDrillPage /> }
    case '/practice/score':
      return { title: '点数計算', element: <ScoreDrillPage /> }
    case '/score-table':
      return { title: '点数早見表', element: <ScoreTablePage /> }
    case '/practice/waits':
      return { title: '待ち当て', element: <WaitsDrillPage /> }
    case '/practice/defense':
      return { title: '守備', element: <DefenseDrillPage /> }
    case '/practice/judgment':
      return { title: '判断', element: <JudgmentPage /> }
    case '/practice/judgment/pushfold':
      return { title: '押し引きジャッジ', element: <PushFoldPage /> }
    case '/practice/judgment/plan':
      return { title: '配牌方針クイズ', element: <PlanPage /> }
    case '/practice/judgment/call':
      return { title: '鳴き判断クイズ', element: <CallPage /> }
    case '/practice/solo':
      return { title: '一人麻雀', element: <SoloPage /> }
    case '/about':
      return { title: 'このサイトについて', element: <AboutPage /> }
    case '/dev/tiles':
      return { title: '牌の表示確認', element: <DevTilesPage /> }
    case '/dev/drill':
      return { title: 'ドリル部品の確認', element: <DevDrillPage /> }
  }
  if (path === '/records') return { title: '学習記録', element: <RecordsPage /> }
  const review = path.match(/^\/records\/review\/([a-z0-9-]+)\/(mistakes|favorites)$/)
  if (review) {
    return { title: '解き直し', element: <ReviewPage drillId={review[1]} mode={review[2] as 'mistakes' | 'favorites'} /> }
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

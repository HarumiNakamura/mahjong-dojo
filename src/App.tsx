import { lazy, Suspense, type ReactNode } from 'react'
import { usePath } from './app/router'
import { findComingSoonPage } from './app/routes'
import { Layout } from './components/layout/Layout'
import { TileSettingsProvider } from './components/tile/TileSettingsProvider'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

// ページは必要になったときに読み込む(最初に読み込む量を減らす)
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const CallPage = lazy(() => import('./pages/CallPage').then((m) => ({ default: m.CallPage })))
const DefenseDrillPage = lazy(() => import('./pages/DefenseDrillPage').then((m) => ({ default: m.DefenseDrillPage })))
const DevDrillPage = lazy(() => import('./pages/DevDrillPage').then((m) => ({ default: m.DevDrillPage })))
const DevOgPage = lazy(() => import('./pages/DevOgPage').then((m) => ({ default: m.DevOgPage })))
const DevTilesPage = lazy(() => import('./pages/DevTilesPage').then((m) => ({ default: m.DevTilesPage })))
const EfficiencyDrillPage = lazy(() => import('./pages/EfficiencyDrillPage').then((m) => ({ default: m.EfficiencyDrillPage })))
const JudgmentPage = lazy(() => import('./pages/JudgmentPage').then((m) => ({ default: m.JudgmentPage })))
const LearnPage = lazy(() => import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })))
const PlanPage = lazy(() => import('./pages/PlanPage').then((m) => ({ default: m.PlanPage })))
const PracticePage = lazy(() => import('./pages/PracticePage').then((m) => ({ default: m.PracticePage })))
const PushFoldPage = lazy(() => import('./pages/PushFoldPage').then((m) => ({ default: m.PushFoldPage })))
const ScoreDrillPage = lazy(() => import('./pages/ScoreDrillPage').then((m) => ({ default: m.ScoreDrillPage })))
const ScoreTablePage = lazy(() => import('./pages/ScoreTablePage').then((m) => ({ default: m.ScoreTablePage })))
const SharedQuestionPage = lazy(() => import('./pages/SharedQuestionPage').then((m) => ({ default: m.SharedQuestionPage })))
const SoloPage = lazy(() => import('./pages/SoloPage').then((m) => ({ default: m.SoloPage })))
const TodayPage = lazy(() => import('./pages/TodayPage').then((m) => ({ default: m.TodayPage })))
const WaitsDrillPage = lazy(() => import('./pages/WaitsDrillPage').then((m) => ({ default: m.WaitsDrillPage })))
const PlayStatsPage = lazy(() => import('./pages/play/PlayStatsPage').then((m) => ({ default: m.PlayStatsPage })))
const GameReviewPage = lazy(() => import('./pages/play/GameReviewPage').then((m) => ({ default: m.GameReviewPage })))
const ReplayPage = lazy(() => import('./pages/play/ReplayPage').then((m) => ({ default: m.ReplayPage })))
const PlayPage = lazy(() => import('./pages/PlayPage').then((m) => ({ default: m.PlayPage })))
const PrivacyPage = lazy(() => import('./pages/site/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const ContactPage = lazy(() => import('./pages/site/ContactPage').then((m) => ({ default: m.ContactPage })))
const DisclaimerPage = lazy(() => import('./pages/site/DisclaimerPage').then((m) => ({ default: m.DisclaimerPage })))
const ArticleRoute = lazy(() => import('./pages/ArticlePage').then((m) => ({ default: m.ArticleRoute })))
const RecordsPage = lazy(() => import('./pages/records/RecordsPage').then((m) => ({ default: m.RecordsPage })))
const ReviewPage = lazy(() => import('./pages/records/ReviewPage').then((m) => ({ default: m.ReviewPage })))

/** パスに対応するページと題名 */
function resolvePage(path: string): { title?: string | null; element: ReactNode } {
  switch (path) {
    case '/':
      return { element: <HomePage /> }
    case '/today':
      return { title: '今日の練習', element: <TodayPage /> }
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
    case '/play':
      return { title: 'CPU対戦', element: <PlayPage /> }
    case '/play/replay':
      return { title: 'CPU対戦の牌譜', element: <ReplayPage /> }
    case '/play/stats':
      return { title: 'CPU対戦の成績', element: <PlayStatsPage /> }
    case '/play/review':
      return { title: 'CPU対戦の振り返り', element: <GameReviewPage /> }
    case '/privacy':
      return { title: 'プライバシーポリシー', element: <PrivacyPage /> }
    case '/contact':
      return { title: '運営者情報・お問い合わせ', element: <ContactPage /> }
    case '/disclaimer':
      return { title: '免責事項', element: <DisclaimerPage /> }
    case '/dev/tiles':
      return { title: '牌の表示確認', element: <DevTilesPage /> }
    case '/dev/drill':
      return { title: 'ドリル部品の確認', element: <DevDrillPage /> }
  }
  const og = path.match(/^\/dev\/og\/([a-z0-9-]+)$/)
  if (og) return { title: 'OGP 画像', element: <DevOgPage id={og[1]} /> }
  const shared = path.match(/^\/q\/([a-z0-9-]+)$/)
  if (shared) return { title: '共有された問題', element: <SharedQuestionPage drillId={shared[1]} /> }
  if (path === '/learn') return { title: '解説', element: <LearnPage /> }
  // 記事の題名は記事ページが自分で設定する(記事の本文を最初に読み込まないため)
  const learn = path.match(/^\/learn\/([a-z0-9-]+)$/)
  if (learn) return { title: null, element: <ArticleRoute slug={learn[1]} /> }
  if (path === '/records') return { title: '学習記録', element: <RecordsPage /> }
  const review = path.match(/^\/records\/review\/([a-z0-9-]+)\/(mistakes|favorites)$/)
  if (review) {
    return { title: '解き直し', element: <ReviewPage drillId={review[1]} mode={review[2] as 'mistakes' | 'favorites'} /> }
  }
  const soon = findComingSoonPage(path)
  if (soon) return { title: soon.title, element: <ComingSoonPage page={soon} /> }
  return { title: 'ページが見つかりません', element: <NotFoundPage /> }
}

/** PC で本文を広く使うページ(一覧と記事) */
const isWide = (path: string) => ['/', '/practice', '/practice/judgment', '/learn'].includes(path) || /^\/learn\/[a-z0-9-]+$/.test(path)

function App() {
  const path = usePath()
  const { title, element } = resolvePage(path)
  return (
    <TileSettingsProvider>
      {/* key でページごとに状態をリセットする */}
      {/* CPU対戦は操作ボタンが画面の下にあるので、広告枠を出さない */}
      <Layout title={title} hideAd={path === '/play' || path === '/play/replay'} wide={isWide(path)}>
        <div key={path}>
          <Suspense fallback={<p className="page-loading">読み込み中…</p>}>{element}</Suspense>
        </div>
      </Layout>
    </TileSettingsProvider>
  )
}

export default App

import './App.css'
import { DevTilesPage } from './pages/DevTilesPage'
import { TileSettingsProvider } from './components/tile/TileSettingsProvider'

function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function App() {
  const path = currentPath()
  return (
    <TileSettingsProvider>
      {path === '/dev/tiles' ? (
        <DevTilesPage />
      ) : (
        <main className="app">
          <h1>麻雀道場(仮)</h1>
        </main>
      )}
    </TileSettingsProvider>
  )
}

export default App

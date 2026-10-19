import { PLAY_PAGE, PRACTICE_PAGES } from '../app/routes'
import { IconCard } from '../components/card/IconCard'
import './pages.css'

export function PracticePage() {
  return (
    <>
      <h1 className="page-title">練習</h1>
      <p className="page-lead">練習したい分野を選んでください。1問ずつ答えて、すぐに解説を確認できます。</p>
      <ul className="icon-card-grid icon-card-grid--3">
        {[...PRACTICE_PAGES, { ...PLAY_PAGE, title: `${PLAY_PAGE.title}(仕上げ)` }].map((page) => (
          <li key={page.path} className={page.featured ? 'icon-card-grid-featured' : undefined}>
            <IconCard to={page.path} title={page.title} text={page.description} icon={page.icon} featured={page.featured} badge={page.comingSoon ? '準備中' : undefined} />
          </li>
        ))}
      </ul>
    </>
  )
}

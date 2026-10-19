import { IconCard } from '../components/card/IconCard'
import { JUDGMENT_PAGES } from '../app/routes'
import './pages.css'

export function JudgmentPage() {
  return (
    <>
      <h1 className="page-title">判断の練習</h1>
      <p className="page-lead">
        押すか降りるか、配牌からどう進めるか、鳴くかどうか。正解が1つに決まりにくい場面を、目安の計算で考えます。
      </p>
      <ul className="icon-card-grid icon-card-grid--3">
        {JUDGMENT_PAGES.map((page) => (
          <li key={page.path}>
            <IconCard to={page.path} title={page.title} text={page.description} icon={page.icon} badge={page.comingSoon ? '準備中' : undefined} />
          </li>
        ))}
      </ul>
    </>
  )
}

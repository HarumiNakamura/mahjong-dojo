import { Link } from '../../app/Link'
import { parseTiles } from '../../engine/tiles'
import { Tile } from '../tile/Tile'
import './iconCard.css'

interface Props {
  to: string
  title: string
  text: string
  /** アイコンに描く牌(牌の文字列表記) */
  icon?: string
  /** 大きく出す(初めての人に最初にやってほしいもの) */
  featured?: boolean
  badge?: string
}

/** 牌のアイコンつきのカード型リンク(練習メニュー・解説の一覧) */
export function IconCard({ to, title, text, icon, featured = false, badge }: Props) {
  return (
    <Link to={to} className={`icon-card${featured ? ' icon-card--featured' : ''}`}>
      {icon && (
        <span className={`icon-card-icon${parseTiles(icon).length >= 3 ? ' icon-card-icon--many' : ''}`} aria-hidden="true">
          {parseTiles(icon).map((t, i) => (
            <Tile key={i} tile={t} showLabel={false} />
          ))}
        </span>
      )}
      <span className="icon-card-body">
        {featured && <span className="icon-card-tag">はじめての方はここから</span>}
        <span className="icon-card-title">
          {title}
          {badge && <span className="badge">{badge}</span>}
        </span>
        <span className="icon-card-text">{text}</span>
      </span>
    </Link>
  )
}

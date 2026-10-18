import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { navigate, normalizePath, usePath } from './router'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
}

/** サイト内リンク。ページを読み込み直さずに移動する。今のページなら aria-current が付く。 */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const path = usePath()
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    // 新しいタブで開く操作などはブラウザに任せる
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} onClick={handleClick} aria-current={normalizePath(to) === path ? 'page' : undefined} {...rest}>
      {children}
    </a>
  )
}

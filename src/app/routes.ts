// サイトのページ構成

export interface PageInfo {
  path: string
  title: string
  /** 一覧やホームに出す短い説明 */
  description: string
  /** まだ作っていないページ */
  comingSoon?: boolean
}

export const PRACTICE_PAGES: readonly PageInfo[] = [
  {
    path: '/practice/efficiency',
    title: '牌効率',
    description: '何を切れば早くテンパイできるか。受け入れ枚数で比べて練習します。',
    comingSoon: true,
  },
  {
    path: '/practice/waits',
    title: '待ち',
    description: 'テンパイした手の待ち牌をすべて見つける練習です。',
    comingSoon: true,
  },
  {
    path: '/practice/score',
    title: '点数計算',
    description: '符と翻から点数を求める練習です。',
    comingSoon: true,
  },
  {
    path: '/practice/defense',
    title: '守備',
    description: '相手のリーチに対して、安全な牌(安パイ)を選ぶ練習です。',
    comingSoon: true,
  },
  {
    path: '/practice/judgment',
    title: '判断',
    description: '押すか引くか、配牌からどう進めるかを考える練習です。',
    comingSoon: true,
  },
]

export const LEARN_PAGE: PageInfo = {
  path: '/learn',
  title: '解説',
  description: '麻雀の基本から、牌効率・守備・点数計算の考え方までを読んで学べます。',
  comingSoon: true,
}

export const RECORDS_PAGE: PageInfo = {
  path: '/records',
  title: '学習記録',
  description: 'これまでの正解率や苦手な分野を確認できます。記録はこのブラウザに保存されます。',
  comingSoon: true,
}

export interface NavItem {
  path: string
  label: string
  children?: readonly NavItem[]
}

/** ナビゲーションの並び */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'ホーム' },
  {
    path: '/practice',
    label: '練習',
    children: PRACTICE_PAGES.map((p) => ({ path: p.path, label: p.title })),
  },
  { path: LEARN_PAGE.path, label: LEARN_PAGE.title },
  { path: RECORDS_PAGE.path, label: RECORDS_PAGE.title },
  { path: '/about', label: 'このサイトについて' },
]

/** 準備中ページの情報をパスから探す */
export function findComingSoonPage(path: string): PageInfo | undefined {
  return [...PRACTICE_PAGES, LEARN_PAGE, RECORDS_PAGE].find((p) => p.path === path && p.comingSoon)
}

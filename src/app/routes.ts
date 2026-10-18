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
  },
  {
    path: '/practice/solo',
    title: '一人麻雀',
    description: '配牌から18巡、1人でツモって切ります。終わったら牌効率で1巡ずつ振り返ります。',
  },
  {
    path: '/practice/waits',
    title: '待ち',
    description: 'テンパイした手の待ち牌をすべて見つける練習です。4枚形から清一色まで、タイムアタックもあります。',
  },
  {
    path: '/practice/score',
    title: '点数計算',
    description: '役・翻と符・点数を段階的に答える練習です。点数早見表もあります。',
  },
  {
    path: '/practice/defense',
    title: '守備',
    description: '相手のリーチに対して、手牌を安全な順に並べる練習と、流局まで逃げ切るベタオリサバイバルです。',
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
  description: 'これまでの正解率や間違えた問題を確認し、解き直せます。記録はこの端末のブラウザに保存されます。',
}

export const SCORE_TABLE_PAGE: PageInfo = {
  path: '/score-table',
  title: '点数早見表',
  description: '符と翻から点数を引ける表です(Mリーグルール版。親・子の切り替えあり)。',
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

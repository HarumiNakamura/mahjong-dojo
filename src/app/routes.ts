// サイトのページ構成

export interface PageInfo {
  path: string
  title: string
  /** 一覧やホームに出す短い説明 */
  description: string
  /** まだ作っていないページ */
  comingSoon?: boolean
  /** カードのアイコンに描く牌(牌の文字列表記) */
  icon?: string
  /** 初めての人に最初にやってほしい練習(カードを大きくする) */
  featured?: boolean
}

export const PRACTICE_PAGES: readonly PageInfo[] = [
  {
    path: '/practice/efficiency',
    icon: '35m',
    featured: true,
    title: '牌効率',
    description: '何を切れば早くテンパイできるか。受け入れ枚数で比べて練習します。',
  },
  {
    path: '/practice/solo',
    icon: '0p',
    title: '一人麻雀',
    description: '配牌から18巡、1人でツモって切ります。終わったら牌効率で1巡ずつ振り返ります。',
  },
  {
    path: '/practice/waits',
    icon: '23s',
    title: '待ち',
    description: 'テンパイした手の待ち牌をすべて見つける練習です。4枚形から清一色まで、タイムアタックもあります。',
  },
  {
    path: '/practice/score',
    icon: '7z',
    title: '点数計算',
    description: '役・翻と符・点数を段階的に答える練習です。点数早見表もあります。',
  },
  {
    path: '/practice/defense',
    icon: '1z',
    title: '守備',
    description: '相手のリーチに対して、手牌を安全な順に並べる練習と、流局まで逃げ切るベタオリサバイバルです。',
  },
  {
    path: '/practice/judgment',
    icon: '5z',
    title: '判断',
    description: '押すか降りるか、配牌からの方針、鳴くかどうかを考える練習です。',
  },
]

/** 判断の練習(/practice/judgment の中の各ドリル) */
export const JUDGMENT_PAGES: readonly PageInfo[] = [
  {
    path: '/practice/judgment/pushfold',
    icon: '9m',
    title: '押し引きジャッジ',
    description: '相手のリーチに対して、危険な牌を切って押すか、降りるか。アガリ率と放銃率から考えます。',
  },
  {
    path: '/practice/judgment/plan',
    icon: '19s',
    title: '配牌方針クイズ',
    description: '配牌を見て、リーチ・タンヤオ・役牌・染め手・七対子・守備寄りのどれを目指すかを選びます。',
  },
  {
    path: '/practice/judgment/call',
    icon: '66z',
    title: '鳴き判断クイズ',
    description: '他の人の捨て牌をポン・チーするか、スルーするかを判断します。',
  },
]

/** CPU対戦(実戦。練習の仕上げ) */
export const PLAY_PAGE: PageInfo = {
  path: '/play',
    icon: '1234z',
  title: 'CPU対戦',
  description: 'CPU 3人と東南戦(半荘)を打ちます。終わったら、分かれ目や押し引きを振り返れます。難易度は3段階、ヒントつきの練習モードもあります。',
}

export const LEARN_PAGE: PageInfo = {
  path: '/learn',
  title: '解説',
  description: '麻雀の基本から、牌効率・守備・点数計算の考え方までを読んで学べます。',
}

export const TODAY_PAGE: PageInfo = {
  path: '/today',
    icon: '5p',
  title: '今日の練習',
  description: '毎日入れ替わる5問を、いろいろな分野から1問ずつ解きます。',
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
  { path: PLAY_PAGE.path, label: PLAY_PAGE.title },
  { path: LEARN_PAGE.path, label: LEARN_PAGE.title },
  { path: RECORDS_PAGE.path, label: RECORDS_PAGE.title },
  { path: '/about', label: 'このサイトについて' },
]

/** 準備中ページの情報をパスから探す */
export function findComingSoonPage(path: string): PageInfo | undefined {
  return [...PRACTICE_PAGES, ...JUDGMENT_PAGES, LEARN_PAGE, RECORDS_PAGE].find((p) => p.path === path && p.comingSoon)
}

/** サイトの情報のページ(フッターに並べる) */
export const SITE_PAGES: readonly PageInfo[] = [
  { path: '/about', title: 'このサイトについて', description: 'このサイトの目的・使い方・ルール・学習記録の扱いについての説明です。' },
  { path: '/privacy', title: 'プライバシーポリシー', description: '学習記録の保存場所(ブラウザの中だけ)と、広告(Google アドセンス)の Cookie についての説明です。' },
  { path: '/contact', title: '運営者情報・お問い合わせ', description: 'サイトの運営者と、お問い合わせフォームの案内です。' },
  { path: '/disclaimer', title: '免責事項', description: '判定の数値は統計をもとにした目安であることなど、サイトの利用についての注意です。' },
]

/** パスからページの情報を探す(記事のドリル案内などに使う) */
export function findPageInfo(path: string): PageInfo | undefined {
  return [...PRACTICE_PAGES, ...JUDGMENT_PAGES, PLAY_PAGE, LEARN_PAGE, RECORDS_PAGE, SCORE_TABLE_PAGE, TODAY_PAGE, ...SITE_PAGES].find((p) => p.path === path)
}

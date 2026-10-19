// 振り返りの分類ごとの、関連する練習と解説記事

import type { FindingCategory } from '../../review/types'

export interface ReviewLinks {
  drill: { path: string; label: string }
  articles: { path: string; label: string }[]
}

export const REVIEW_LINKS: Record<FindingCategory, ReviewLinks> = {
  discard: {
    drill: { path: '/practice/efficiency', label: '何切るドリル' },
    articles: [
      { path: '/learn/efficiency', label: '牌効率の基本' },
      { path: '/learn/ukeire', label: '受け入れ枚数とは' },
    ],
  },
  pushfold: {
    drill: { path: '/practice/judgment/pushfold', label: '押し引きジャッジ' },
    articles: [{ path: '/learn/pushfold', label: '押し引きの考え方' }],
  },
  dealin: {
    drill: { path: '/practice/defense', label: '守備の練習' },
    articles: [
      { path: '/learn/safe-tiles', label: '現物・スジ・壁' },
      { path: '/learn/betaori', label: 'ベタオリの手順' },
    ],
  },
  call: {
    drill: { path: '/practice/judgment/call', label: '鳴き判断クイズ' },
    articles: [{ path: '/learn/calls', label: '鳴き判断' }],
  },
  missedWin: {
    drill: { path: '/practice/waits', label: '待ち当てドリル' },
    articles: [
      { path: '/learn/waits', label: '待ちの種類' },
      { path: '/learn/furiten', label: 'フリテン' },
    ],
  },
  riichi: {
    drill: { path: '/practice/score', label: '点数計算ドリル' },
    articles: [
      { path: '/learn/riichi', label: 'リーチ判断' },
      { path: '/learn/yaku', label: '役一覧(よく出る順)' },
    ],
  },
}

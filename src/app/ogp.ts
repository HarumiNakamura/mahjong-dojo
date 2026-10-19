// OGP(SNS で共有したときに出る画像と文)の設定
//
// 画像は public/og/<id>.png(1200×630)。`npm run build:og` で /dev/og/<id> の画面を撮影して作る。

import { SITE_NAME } from '../config/site'

export interface OgCard {
  id: string
  title: string
  text: string
  /** 画像に描く牌 */
  tiles: string
}

export const OG_CARDS: readonly OgCard[] = [
  { id: 'default', title: SITE_NAME, text: '解説を読んで、すぐ手を動かして、なぜ正解かを画面で確かめる麻雀練習サイト', tiles: '123m406p789s1122z' },
  { id: 'efficiency', title: '何切る(牌効率)', text: 'どれを切れば一番早くテンパイする?受け入れ枚数で答え合わせ', tiles: '234m3467p13s4566s1z' },
  { id: 'waits', title: '待ち当て', text: 'この手の待ちは何?すべて見つけられるかな', tiles: '1112345678999m' },
  { id: 'score', title: '点数計算', text: '役・符・点数を段階的に答える練習', tiles: '234567m777p45s11z6s' },
  { id: 'safety', title: '安パイ並べ', text: '相手のリーチ。手牌を安全な順に並べよう', tiles: '159m46p37s1234z55z' },
  { id: 'betaori', title: 'ベタオリサバイバル', text: 'リーチを受けたら流局まで逃げ切れるか', tiles: '1144z234m67p3459s' },
  { id: 'pushfold', title: '押し引きジャッジ', text: '危険牌を切って押す?それとも降りる?', tiles: '234m567p34s88s5m6p' },
  { id: 'plan', title: '配牌方針クイズ', text: 'この配牌、どの手を目指す?', tiles: '1m123578899s4456z' },
  { id: 'call', title: '鳴き判断クイズ', text: 'ポン?チー?それともスルー?', tiles: '234m57p34s55z1199m' },
]

export const ogImagePath = (id: string) => `/og/${OG_CARDS.some((c) => c.id === id) ? id : 'default'}.png`

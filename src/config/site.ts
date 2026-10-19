// サイト名・説明・公開 URL(サイト全体でここだけに書く)
//
// 環境変数で上書きできる(ビルド時に読む。Cloudflare の Workers Builds の「変数」や .env.local で設定)
//   VITE_SITE_NAME        … サイト名(「(仮)」を除いた名前)
//   VITE_SITE_PROVISIONAL … "false" にすると、サイト名の「(仮)」を外す
//   VITE_SITE_URL         … 公開 URL(末尾の / なし)。独自ドメインに移したらここを変える
// 正式な名前・ドメインが決まったら、下の既定値を変えるか、環境変数を設定する。

const env = (import.meta.env ?? {}) as Record<string, string | undefined>

/** サイト名(「(仮)」を除く) */
export const SITE_BASE_NAME = env.VITE_SITE_NAME || '麻雀道場'
/** 仮の名前か(「(仮)」を付ける) */
export const SITE_PROVISIONAL = env.VITE_SITE_PROVISIONAL !== 'false'
/** 表示するサイト名 */
export const SITE_NAME = SITE_PROVISIONAL ? `${SITE_BASE_NAME}(仮)` : SITE_BASE_NAME
/** 公開 URL(末尾の / なし) */
export const SITE_URL = (env.VITE_SITE_URL || 'https://mahjong-dojo.printempslamer.workers.dev').replace(/\/+$/, '')
/** ホームの題名に添える一言 */
export const SITE_TAGLINE = '麻雀初心者のための練習サイト'
export const SITE_DESCRIPTION =
  '麻雀初心者のための練習サイト。牌効率・待ち・守備・押し引き・点数計算・配牌方針を、解説を読んですぐ手を動かしながら学べます。'

/** ブラウザのタブや検索結果に出す題名(ページの題名が空ならホーム) */
export function siteTitle(pageTitle: string): string {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TAGLINE}`
}

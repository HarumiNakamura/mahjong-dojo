// 運営者が書き込む情報(公開前にここを埋める)
//
// 空のままのものは、画面に「準備中」と表示する。

export const SITE_INFO = {
  /** 運営者名(ハンドルネームでもよい) */
  operatorName: '',
  /** お問い合わせ用の Google フォームの URL(例: https://forms.gle/xxxx) */
  contactFormUrl: '',
  /** Google の広告設定のページの URL(パーソナライズ広告を無効にできるページ) */
  googleAdSettingsUrl: '',
  /** プライバシーポリシーなどの制定日・改定日 */
  policyDate: '2026年10月19日',
} as const

/** 業界団体の、第三者配信事業者の Cookie を無効にできるページ */
export const ABOUT_ADS_URL = 'https://www.aboutads.info/'

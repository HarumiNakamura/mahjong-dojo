// デザイン3案の比較(/dev/theme)で使うデザイントークン
//
// 色・フォント・角丸・影を案ごと・ライト/ダークごとにまとめる。案の切り替えは、このトークンを
// CSS 変数として差し替えるだけで済む。本番のページにはまだ使っていない(改善7で選んだ案だけを残す)。
// 文字と背景のコントラストは themes.test.ts で WCAG AA(4.5:1、大きい文字・部品は 3:1)を確かめる。

export type ThemeId = 'dojo' | 'jantaku' | 'ai'
export type Mode = 'light' | 'dark'

export interface ThemeColors {
  /** ページの背景 */
  bg: string
  /** カードなどの面 */
  surface: string
  /** 少し沈んだ面(表の見出し・ヒントなど) */
  surface2: string
  text: string
  textMuted: string
  border: string
  /** 主な色(ボタン・リンク・強調) */
  accent: string
  /** accent の上の文字 */
  accentContrast: string
  /** accent の薄い背景 */
  accentSoft: string
  /** 差し色(正解の印・点棒など) */
  accent2: string
  /** ヘッダーの帯 */
  headerBg: string
  headerText: string
  /** 牌を置く場面の背景(雀卓のフェルトなど) */
  scene: string
  sceneText: string
  correct: string
  wrong: string
  focus: string
}

export interface Theme {
  id: ThemeId
  name: string
  /** 狙い(一言) */
  concept: string
  /** 見出しのフォント(CSS の font-family) */
  headingFont: string
  /** 見出しのフォントの説明 */
  headingFontLabel: string
  headingWeight: number
  /** 角丸(カード・ボタン) */
  radius: string
  /** カードの影 */
  shadow: { light: string; dark: string }
  colors: Record<Mode, ThemeColors>
}

/** 本文のフォント(3案共通): BIZ UDPゴシック */
export const BODY_FONT = "'BIZ UDPGothic', system-ui, sans-serif"

export const THEMES: readonly Theme[] = [
  {
    id: 'dojo',
    name: 'A 道場',
    concept: '墨色の見出し帯と、中(チュン)の牌の朱色。見出しは明朝体で、道場の看板のような引きしまった印象に。',
    headingFont: "'Shippori Mincho B1', serif",
    headingFontLabel: 'しっぽり明朝 B1(太さ 800)',
    headingWeight: 800,
    radius: '4px',
    shadow: { light: 'none', dark: 'none' },
    colors: {
      light: {
        bg: '#ffffff',
        surface: '#ffffff',
        surface2: '#f3f3f2',
        text: '#1b1b1d',
        textMuted: '#55565a',
        border: '#cfcfd2',
        accent: '#b3261e',
        accentContrast: '#ffffff',
        accentSoft: '#fbe9e7',
        accent2: '#1b1b1d',
        headerBg: '#1b1b1d',
        headerText: '#ffffff',
        scene: '#f3f3f2',
        sceneText: '#1b1b1d',
        correct: '#1d6b3a',
        wrong: '#b3261e',
        focus: '#1f5fbf',
      },
      dark: {
        bg: '#121213',
        surface: '#1c1c1e',
        surface2: '#26262a',
        text: '#ececee',
        textMuted: '#a9a9b0',
        border: '#3a3a40',
        accent: '#ff8a80',
        accentContrast: '#1b0d0b',
        accentSoft: '#3a1d1a',
        accent2: '#ececee',
        headerBg: '#000000',
        headerText: '#ffffff',
        scene: '#26262a',
        sceneText: '#ececee',
        correct: '#7fd39b',
        wrong: '#ff8a80',
        focus: '#8ab4f8',
      },
    },
  },
  {
    id: 'jantaku',
    name: 'B 雀卓',
    concept: '濃い緑のフェルトの上に牌を置く「卓の上」の場面。点棒の赤・青を差し色にして、遊びの楽しさを出す。',
    headingFont: "'Zen Maru Gothic', sans-serif",
    headingFontLabel: 'Zen丸ゴシック(太さ 700)',
    headingWeight: 700,
    radius: '14px',
    shadow: { light: '0 2px 8px rgba(10, 40, 25, 0.12)', dark: '0 2px 10px rgba(0, 0, 0, 0.5)' },
    colors: {
      light: {
        bg: '#eef1ef',
        surface: '#ffffff',
        surface2: '#e2e8e4',
        text: '#14231b',
        textMuted: '#4a5a51',
        border: '#c5d0c9',
        accent: '#1557b0',
        accentContrast: '#ffffff',
        accentSoft: '#e3ecf8',
        accent2: '#c62828',
        headerBg: '#0c4a33',
        headerText: '#ffffff',
        scene: '#0f5a3d',
        sceneText: '#ffffff',
        correct: '#1b6e3c',
        wrong: '#c62828',
        focus: '#1557b0',
      },
      dark: {
        bg: '#0b1310',
        surface: '#13201a',
        surface2: '#1b2b23',
        text: '#e5eee9',
        textMuted: '#a4b5ab',
        border: '#2e4238',
        accent: '#82b1ff',
        accentContrast: '#0a1630',
        accentSoft: '#172a4a',
        accent2: '#ff8a80',
        headerBg: '#08261a',
        headerText: '#ffffff',
        scene: '#0d3b29',
        sceneText: '#ffffff',
        correct: '#7fd39b',
        wrong: '#ff8a80',
        focus: '#82b1ff',
      },
    },
  },
  {
    id: 'ai',
    name: 'C 藍(おまかせ)',
    concept: '藍染めの手ぬぐいのような藍色と、役満の金。和の落ち着きと、点数表のような読みやすさを両立する。',
    headingFont: "'Zen Kaku Gothic New', sans-serif",
    headingFontLabel: 'Zen角ゴシック New(太さ 900)',
    headingWeight: 900,
    radius: '10px',
    shadow: { light: '0 1px 3px rgba(20, 35, 80, 0.12)', dark: '0 1px 4px rgba(0, 0, 0, 0.5)' },
    colors: {
      light: {
        bg: '#f3f5f9',
        surface: '#ffffff',
        surface2: '#e7ebf3',
        text: '#18213a',
        textMuted: '#4d566e',
        border: '#c9d0de',
        accent: '#24356b',
        accentContrast: '#ffffff',
        accentSoft: '#e4e9f5',
        accent2: '#8a6414',
        headerBg: '#24356b',
        headerText: '#ffffff',
        scene: '#24356b',
        sceneText: '#ffffff',
        correct: '#1d6b3a',
        wrong: '#b3261e',
        focus: '#8a6414',
      },
      dark: {
        bg: '#0f1424',
        surface: '#171e33',
        surface2: '#202944',
        text: '#e8ebf3',
        textMuted: '#a7afc6',
        border: '#343e5c',
        accent: '#9fb3ef',
        accentContrast: '#0f1424',
        accentSoft: '#25305a',
        accent2: '#e0b44c',
        headerBg: '#0a0f1e',
        headerText: '#ffffff',
        scene: '#1c2a56',
        sceneText: '#ffffff',
        correct: '#7fd39b',
        wrong: '#ff8a80',
        focus: '#e0b44c',
      },
    },
  },
]

/** トークンを CSS 変数にする(サイトの既存の変数名に合わせる) */
export function themeVars(theme: Theme, mode: Mode): Record<string, string> {
  const c = theme.colors[mode]
  return {
    '--bg': c.bg,
    '--surface': c.surface,
    '--surface-2': c.surface2,
    '--text': c.text,
    '--text-muted': c.textMuted,
    '--border': c.border,
    '--accent': c.accent,
    '--accent-hover': c.accent,
    '--accent-contrast': c.accentContrast,
    '--accent-soft': c.accentSoft,
    '--accent-2': c.accent2,
    '--header-bg': c.headerBg,
    '--header-text': c.headerText,
    '--scene': c.scene,
    '--scene-text': c.sceneText,
    '--correct': c.correct,
    '--wrong': c.wrong,
    '--focus': c.focus,
    '--radius': theme.radius,
    '--shadow-card': theme.shadow[mode],
    '--font-body': BODY_FONT,
    '--font-heading': theme.headingFont,
    '--heading-weight': String(theme.headingWeight),
  }
}

// ---- コントラスト(WCAG 2.1) ----

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

/** 2色のコントラスト比(1〜21) */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** 確かめる文字と背景の組み合わせ(最低のコントラスト比) */
export const CONTRAST_PAIRS: readonly { fg: keyof ThemeColors; bg: keyof ThemeColors; min: number }[] = [
  { fg: 'text', bg: 'bg', min: 4.5 },
  { fg: 'text', bg: 'surface', min: 4.5 },
  { fg: 'text', bg: 'surface2', min: 4.5 },
  { fg: 'textMuted', bg: 'bg', min: 4.5 },
  { fg: 'textMuted', bg: 'surface', min: 4.5 },
  { fg: 'textMuted', bg: 'surface2', min: 4.5 },
  { fg: 'accent', bg: 'surface', min: 4.5 },
  { fg: 'accent', bg: 'bg', min: 4.5 },
  { fg: 'accentContrast', bg: 'accent', min: 4.5 },
  { fg: 'text', bg: 'accentSoft', min: 4.5 },
  { fg: 'headerText', bg: 'headerBg', min: 4.5 },
  { fg: 'sceneText', bg: 'scene', min: 4.5 },
  { fg: 'correct', bg: 'surface', min: 4.5 },
  { fg: 'wrong', bg: 'surface', min: 4.5 },
  { fg: 'accent2', bg: 'surface', min: 3 },
  { fg: 'focus', bg: 'surface', min: 3 },
  { fg: 'border', bg: 'surface', min: 1.3 },
]

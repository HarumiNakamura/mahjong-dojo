// 学習記録(画面やブラウザの保存先とは独立した、純粋なデータ操作)
//
// 1問答えるごとに「ドリルの種類・問題(局面を再現できる形)・回答・正誤・日時」を1件の記録として残す。
// 問題は questionKey で同じ問題かどうかを見分ける(解き直し・お気に入りで使う)。

export const RECORDS_VERSION = 1
/** 保存する回答記録の上限(古いものから消す) */
export const MAX_ATTEMPTS = 2000
/** 書き出しファイルの目印 */
export const RECORDS_FILE_TYPE = 'mahjong-dojo-records'

export interface AttemptRecord {
  /** 記録ごとの固有の番号 */
  id: string
  /** ドリルの種類(例: 'efficiency') */
  drill: string
  /** 同じ問題を見分けるためのキー */
  questionKey: string
  /** 問題を再現するためのデータ(JSON にできる形) */
  question: unknown
  /** 自分の回答(JSON にできる形) */
  answer: unknown
  correct: boolean
  /** 回答した日時(ISO 8601) */
  answeredAt: string
}

export interface FavoriteRecord {
  drill: string
  questionKey: string
  question: unknown
  addedAt: string
}

/** CPU対戦の半荘1回の成績 */
export interface GameRecord {
  id: string
  /** 終わった日時(ISO 8601) */
  playedAt: string
  /** CPU の種類(難易度) */
  cpu: string
  rank: number
  /** ポイント × 10(例: 523 = +52.3pt) */
  points10: number
  /** 最終の持ち点 */
  score: number
  kyoku: number
  hule: number
  /** 放銃の回数 */
  fangchong: number
  lizhi: number
  /** 副露した局の数 */
  fulouKyoku: number
  /** アガリの点数の合計(本場・供託を含まない) */
  huleDefen: number
}

export interface RecordsData {
  version: typeof RECORDS_VERSION
  attempts: AttemptRecord[]
  favorites: FavoriteRecord[]
  /** CPU対戦の成績(古い記録にはないので、読み込み時に空にする) */
  games: GameRecord[]
}

/** 保存する対局成績の上限 */
export const MAX_GAMES = 500

export function emptyRecords(): RecordsData {
  return { version: RECORDS_VERSION, attempts: [], favorites: [], games: [] }
}

/** 対局成績を追加する(上限を超えたら古いものから消す) */
export function addGame(data: RecordsData, game: GameRecord): RecordsData {
  const games = [...data.games, game]
  return { ...data, games: games.length > MAX_GAMES ? games.slice(games.length - MAX_GAMES) : games }
}

export interface GameSummary {
  games: number
  /** 平均順位(対局がなければ null) */
  averageRank: number | null
  /** ポイントの合計 × 10 */
  totalPoints10: number
  /** アガリ率・放銃率(%、小数1桁。局がなければ null) */
  huleRate: number | null
  fangchongRate: number | null
}

const percent1 = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null)

/** CPU対戦の成績をまとめる */
export function gameSummary(games: readonly GameRecord[]): GameSummary {
  const kyoku = games.reduce((a, g) => a + g.kyoku, 0)
  return {
    games: games.length,
    averageRank: games.length ? Math.round((games.reduce((a, g) => a + g.rank, 0) / games.length) * 100) / 100 : null,
    totalPoints10: games.reduce((a, g) => a + g.points10, 0),
    huleRate: percent1(games.reduce((a, g) => a + g.hule, 0), kyoku),
    fangchongRate: percent1(games.reduce((a, g) => a + g.fangchong, 0), kyoku),
  }
}

/** 回答記録を追加する(上限を超えたら古いものから消す) */
export function addAttempt(data: RecordsData, attempt: AttemptRecord): RecordsData {
  const attempts = [...data.attempts, attempt]
  return { ...data, attempts: attempts.length > MAX_ATTEMPTS ? attempts.slice(attempts.length - MAX_ATTEMPTS) : attempts }
}

export function isFavorite(data: RecordsData, drill: string, questionKey: string): boolean {
  return data.favorites.some((f) => f.drill === drill && f.questionKey === questionKey)
}

/** お気に入りに登録・解除する */
export function toggleFavorite(data: RecordsData, favorite: FavoriteRecord): RecordsData {
  if (isFavorite(data, favorite.drill, favorite.questionKey)) {
    return {
      ...data,
      favorites: data.favorites.filter((f) => !(f.drill === favorite.drill && f.questionKey === favorite.questionKey)),
    }
  }
  return { ...data, favorites: [...data.favorites, favorite] }
}

// ---- 集計 ----

export interface DrillStats {
  drill: string
  answered: number
  correct: number
  /** 正解率(%、整数)。回答がなければ null */
  rate: number | null
}

export function statsOf(attempts: readonly AttemptRecord[], drill: string): DrillStats {
  const mine = attempts.filter((a) => a.drill === drill)
  const correct = mine.filter((a) => a.correct).length
  return { drill, answered: mine.length, correct, rate: mine.length ? Math.round((correct / mine.length) * 100) : null }
}

export interface DailyStats {
  /** 日付(YYYY-MM-DD、端末の時刻で数える) */
  date: string
  answered: number
  correct: number
  rate: number | null
}

/** 日付を端末の時刻で YYYY-MM-DD にする */
export function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 最近 days 日分の、日ごとの解いた数と正解率(古い日から順) */
export function dailyTrend(attempts: readonly AttemptRecord[], drill: string, now: Date, days = 7): DailyStats[] {
  const result: DailyStats[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    result.push({ date: localDate(d), answered: 0, correct: 0, rate: null })
  }
  const byDate = new Map(result.map((r) => [r.date, r]))
  for (const a of attempts) {
    if (a.drill !== drill) continue
    const day = byDate.get(localDate(new Date(a.answeredAt)))
    if (!day) continue
    day.answered++
    if (a.correct) day.correct++
  }
  for (const r of result) r.rate = r.answered ? Math.round((r.correct / r.answered) * 100) : null
  return result
}

/** 問題ごとの最新の回答 */
function latestByQuestion(attempts: readonly AttemptRecord[], drill?: string): AttemptRecord[] {
  const latest = new Map<string, AttemptRecord>()
  for (const a of attempts) {
    if (drill !== undefined && a.drill !== drill) continue
    const key = `${a.drill}\n${a.questionKey}`
    const prev = latest.get(key)
    if (!prev || prev.answeredAt <= a.answeredAt) latest.set(key, a)
  }
  return [...latest.values()]
}

/**
 * 間違えた問題(最後に答えたときに不正解だった問題)。新しい順。
 * 解き直して正解すると一覧から消える。
 */
export function mistakes(data: RecordsData, drill?: string): AttemptRecord[] {
  return latestByQuestion(data.attempts, drill)
    .filter((a) => !a.correct)
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
}

/** 記録があるドリルの種類 */
export function drillsInRecords(data: RecordsData): string[] {
  return [...new Set([...data.attempts.map((a) => a.drill), ...data.favorites.map((f) => f.drill)])]
}

// ---- 書き出し・読み込み ----

export interface RecordsFile {
  type: typeof RECORDS_FILE_TYPE
  exportedAt: string
  data: RecordsData
}

/** 書き出し用の JSON 文字列 */
export function exportRecords(data: RecordsData, now: Date): string {
  const file: RecordsFile = { type: RECORDS_FILE_TYPE, exportedAt: now.toISOString(), data }
  return JSON.stringify(file, null, 2)
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'

function validAttempt(v: unknown): v is AttemptRecord {
  return (
    isObject(v) &&
    isString(v.id) &&
    isString(v.drill) &&
    isString(v.questionKey) &&
    'question' in v &&
    'answer' in v &&
    typeof v.correct === 'boolean' &&
    isString(v.answeredAt) &&
    !Number.isNaN(Date.parse(v.answeredAt))
  )
}

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function validGame(v: unknown): v is GameRecord {
  return (
    isObject(v) &&
    isString(v.id) &&
    isString(v.playedAt) &&
    !Number.isNaN(Date.parse(v.playedAt)) &&
    isString(v.cpu) &&
    ['rank', 'points10', 'score', 'kyoku', 'hule', 'fangchong', 'lizhi', 'fulouKyoku', 'huleDefen'].every((k) => isNumber(v[k]))
  )
}

function validFavorite(v: unknown): v is FavoriteRecord {
  return isObject(v) && isString(v.drill) && isString(v.questionKey) && 'question' in v && isString(v.addedAt)
}

/** 保存されていたデータを確かめる。形が違う記録は捨てる(壊れたデータでサイトが止まらないように) */
export function sanitizeRecords(value: unknown): RecordsData {
  if (!isObject(value) || value.version !== RECORDS_VERSION) return emptyRecords()
  return {
    version: RECORDS_VERSION,
    attempts: Array.isArray(value.attempts) ? value.attempts.filter(validAttempt) : [],
    favorites: Array.isArray(value.favorites) ? value.favorites.filter(validFavorite) : [],
    games: Array.isArray(value.games) ? value.games.filter(validGame) : [],
  }
}

/** 書き出したファイルの中身を読む。このサイトの記録でなければエラー */
export function parseRecordsFile(text: string): RecordsData {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('ファイルを読み取れませんでした(JSON の形式ではありません)')
  }
  if (!isObject(json) || json.type !== RECORDS_FILE_TYPE || !isObject(json.data)) {
    throw new Error('このサイトで書き出した記録ファイルではありません')
  }
  if (json.data.version !== RECORDS_VERSION) {
    throw new Error('対応していない形式の記録ファイルです')
  }
  return sanitizeRecords(json.data)
}

/** 読み込んだ記録を今の記録に合わせる(同じ記録は1つにまとめる) */
export function mergeRecords(current: RecordsData, incoming: RecordsData): { data: RecordsData; added: number } {
  const ids = new Set(current.attempts.map((a) => a.id))
  const newAttempts = incoming.attempts.filter((a) => !ids.has(a.id))
  const attempts = [...current.attempts, ...newAttempts].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))
  let favorites = current.favorites
  for (const f of incoming.favorites) {
    if (!isFavorite({ ...current, favorites }, f.drill, f.questionKey)) favorites = [...favorites, f]
  }
  const gameIds = new Set(current.games.map((g) => g.id))
  const newGames = incoming.games.filter((g) => !gameIds.has(g.id))
  const games = [...current.games, ...newGames].sort((a, b) => a.playedAt.localeCompare(b.playedAt))
  return {
    data: {
      version: RECORDS_VERSION,
      attempts: attempts.length > MAX_ATTEMPTS ? attempts.slice(attempts.length - MAX_ATTEMPTS) : attempts,
      favorites,
      games: games.length > MAX_GAMES ? games.slice(games.length - MAX_GAMES) : games,
    },
    added: newAttempts.length + newGames.length,
  }
}

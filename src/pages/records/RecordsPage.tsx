import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from '../../app/Link'
import { StorageNotice } from '../../app/records/StorageNotice'
import { useRecords } from '../../app/records/useRecords'
import { DRILLS, findDrill } from '../../drills/registry'
import {
  dailyTrend,
  emptyRecords,
  exportRecords,
  gameSummary,
  removeBookmark,
  type GameRecord,
  type SceneBookmark,
  localDate,
  mergeRecords,
  mistakes,
  paipuInFile,
  parseRecordsFile,
  statsOf,
  toggleFavorite,
} from '../../engine/records'
import { addPaipuRecords, clearPaipuRecords, loadPaipuRecords } from '../../app/paipuStore'
import { sanitizePaipuRecords } from '../../game/paipuRecords'
import { replayUrl, reviewUrl } from '../../game/replay'
import { formatPoints } from '../../game/result'
import { TrendChart } from './TrendChart'
import './records.css'
import '../pages.css'

/** 間違えた問題の一覧で最初に見せる件数 */
const MISTAKES_SHOWN = 20

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 保存データから問題を作り直す。壊れていたら null */
function restore(drillId: string, data: unknown) {
  const drill = findDrill(drillId)
  if (!drill) return null
  try {
    return { drill, question: drill.fromData(data) }
  } catch {
    return null
  }
}

/** CPU対戦の成績(対局したことがあるときだけ出す) */
function GameSection({
  games,
  bookmarks,
  onRemoveBookmark,
}: {
  games: readonly GameRecord[]
  bookmarks: readonly SceneBookmark[]
  onRemoveBookmark: (id: string) => void
}) {
  // 練習モードの対局は通算成績(/play/stats)で分けて見る
  const s = gameSummary(games.filter((g) => !g.practice))
  const [replayable] = useState(() => new Set(loadPaipuRecords().map((r) => r.id)))
  const recent = games.slice(-5).reverse()
  return (
    <section className="rec-section">
      <h2>CPU対戦の成績</h2>
      <div className="rec-card">
        <dl className="rec-stats">
          <div>
            <dt>対局数</dt>
            <dd>{s.games}回</dd>
          </div>
          <div>
            <dt>平均順位</dt>
            <dd>{s.averageRank === null ? '-' : `${s.averageRank.toFixed(2)}位`}</dd>
          </div>
          <div>
            <dt>合計ポイント</dt>
            <dd>{formatPoints(s.totalPoints10)}</dd>
          </div>
          <div>
            <dt>アガリ率</dt>
            <dd>{s.huleRate === null ? '-' : `${s.huleRate}%`}</dd>
          </div>
          <div>
            <dt>放銃率</dt>
            <dd>{s.fangchongRate === null ? '-' : `${s.fangchongRate}%`}</dd>
          </div>
        </dl>
        <p className="rec-empty">
          練習モードを除いた成績です。<Link to="/play/stats">難易度ごとの通算成績</Link>
        </p>
        <h3 className="rec-subheading">最近の対局</h3>
        <ul className="rec-games">
          {recent.map((g) => (
            <li key={g.id}>
              {formatDateTime(g.playedAt)} {g.rank}位 {g.score.toLocaleString('ja-JP')}点({formatPoints(g.points10)})
              {replayable.has(g.id) && (
                <>
                  {' '}
                  <Link to={reviewUrl(g.id)}>振り返り</Link> <Link to={replayUrl(g.id)}>牌譜</Link>
                </>
              )}
            </li>
          ))}
        </ul>
        {bookmarks.length > 0 && (
          <>
            <h3 className="rec-subheading">CPU対戦の復習リスト</h3>
            <p className="rec-empty">振り返りの分かれ目と、対局中に「この判断を後で見る」を押した場面です。</p>
            <ul className="rec-games">
              {[...bookmarks].reverse().map((b) => (
                <li key={b.id}>
                  {replayable.has(b.gameId) ? <Link to={replayUrl(b.gameId, { kyoku: b.kyoku, step: b.step })}>{b.title}</Link> : b.title}
                  {b.source === 'marker' && '(印)'}{' '}
                  <button type="button" className="rec-remove" onClick={() => onRemoveBookmark(b.id)} aria-label={`${b.title}を復習リストから外す`}>
                    外す
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export function RecordsPage() {
  const { data, update } = useRecords()
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [showAllMistakes, setShowAllMistakes] = useState(false)
  // ページを開いた時点の日付で「最近7日」を数える
  const [now] = useState(() => new Date())

  const wrong = mistakes(data)
  const handleExport = () => {
    const blob = new Blob([exportRecords(data, new Date(), loadPaipuRecords())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mahjong-dojo-records-${localDate(new Date()).replaceAll('-', '')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMessage({ text: '記録をファイルに書き出しました。' })
  }

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const incoming = parseRecordsFile(text)
      addPaipuRecords(sanitizePaipuRecords(paipuInFile(text)))
      let added = 0
      update((current) => {
        const merged = mergeRecords(current, incoming)
        added = merged.added
        return merged.data
      })
      setMessage({ text: `記録を読み込みました(新しい回答記録 ${added}件)。` })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : '読み込みに失敗しました。', error: true })
    }
  }

  const handleClear = () => {
    if (window.confirm('この端末の学習記録とお気に入り(CPU対戦の成績・牌譜を含む)をすべて消します。元に戻せません。よろしいですか?')) {
      update(() => emptyRecords())
      clearPaipuRecords()
      setMessage({ text: '記録をすべて消しました。' })
    }
  }

  return (
    <>
      <h1 className="page-title">学習記録</h1>
      <StorageNotice />

      <section className="rec-section">
        <h2>ドリル別の成績</h2>
        {DRILLS.map((drill) => {
          const s = statsOf(data.attempts, drill.id)
          return (
            <div key={drill.id} className="rec-card">
              <div className="rec-card-head">
                <h3>{drill.title}</h3>
                <Link to={drill.path} className="rec-link">
                  練習する
                </Link>
              </div>
              <dl className="rec-stats">
                <div>
                  <dt>解いた数</dt>
                  <dd>{s.answered}問</dd>
                </div>
                <div>
                  <dt>正解数</dt>
                  <dd>{s.correct}問</dd>
                </div>
                <div>
                  <dt>正解率</dt>
                  <dd>{s.rate === null ? '-' : `${s.rate}%`}</dd>
                </div>
              </dl>
              {s.answered > 0 ? (
                <TrendChart days={dailyTrend(data.attempts, drill.id, now)} />
              ) : (
                <p className="rec-empty">まだ記録がありません。</p>
              )}
            </div>
          )
        })}
      </section>

      {data.games.length > 0 && (
        <GameSection games={data.games} bookmarks={data.bookmarks} onRemoveBookmark={(id) => update((d) => removeBookmark(d, id))} />
      )}

      <section className="rec-section">
        <h2>間違えた問題</h2>
        <p className="rec-note">最後に答えたときに間違えた問題です。解き直して正解すると一覧から消えます。</p>
        {DRILLS.map((drill) => {
          const list = wrong.filter((a) => a.drill === drill.id)
          if (list.length === 0) return null
          return (
            <div key={drill.id}>
              <Link to={`/records/review/${drill.id}/mistakes`} className="button button--primary button--block">
                {drill.title}:間違えた{list.length}問だけ解き直す(ランダム順)
              </Link>
            </div>
          )
        })}
        {wrong.length === 0 ? (
          <p className="rec-empty">間違えた問題はありません。</p>
        ) : (
          <ul className="rec-list">
            {(showAllMistakes ? wrong : wrong.slice(0, MISTAKES_SHOWN)).map((a) => {
              const r = restore(a.drill, a.question)
              if (!r) return null
              return (
                <li key={a.id} className="rec-item">
                  <div className="rec-item-head">
                    <span>{r.drill.title}</span>
                    <time dateTime={a.answeredAt}>{formatDateTime(a.answeredAt)}</time>
                  </div>
                  {r.drill.renderPreview(r.question)}
                  <p className="rec-answer">
                    あなたの回答:{r.drill.describeAnswer(r.question, a.answer)} / 正解:
                    <strong>{r.drill.describeCorrect(r.question)}</strong>
                  </p>
                </li>
              )
            })}
          </ul>
        )}
        {!showAllMistakes && wrong.length > MISTAKES_SHOWN && (
          <button type="button" className="button button--block rec-more" onClick={() => setShowAllMistakes(true)}>
            残り{wrong.length - MISTAKES_SHOWN}問もすべて表示
          </button>
        )}
      </section>

      <section className="rec-section">
        <h2>お気に入りの問題</h2>
        {data.favorites.length === 0 ? (
          <p className="rec-empty">ドリルの「お気に入りに登録」ボタンで登録した問題がここに並びます。</p>
        ) : (
          <>
            {DRILLS.filter((d) => data.favorites.some((f) => f.drill === d.id)).map((drill) => (
              <Link key={drill.id} to={`/records/review/${drill.id}/favorites`} className="button button--block rec-review-fav">
                {drill.title}:お気に入りを解く
              </Link>
            ))}
            <ul className="rec-list">
              {[...data.favorites].reverse().map((f) => {
                const r = restore(f.drill, f.question)
                if (!r) return null
                return (
                  <li key={`${f.drill}-${f.questionKey}`} className="rec-item">
                    <div className="rec-item-head">
                      <span>{r.drill.title}</span>
                      <button type="button" className="rec-unfav" onClick={() => update((d) => toggleFavorite(d, f))}>
                        お気に入りから外す
                      </button>
                    </div>
                    {r.drill.renderPreview(r.question)}
                    <p className="rec-answer">
                      正解:<strong>{r.drill.describeCorrect(r.question)}</strong>
                    </p>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      <section className="rec-section">
        <h2>記録の書き出し・読み込み</h2>
        <p className="rec-note">
          記録をファイル(JSON)に書き出しておくと、ブラウザのデータを消したときや別の端末でも、読み込んで続きから使えます。読み込んだ記録は、今の記録に追加されます。
        </p>
        <div className="rec-actions">
          <button type="button" className="button" onClick={handleExport}>
            記録を書き出す
          </button>
          <button type="button" className="button" onClick={() => fileInput.current?.click()}>
            記録を読み込む
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
        {message && (
          <p className={`rec-message${message.error ? ' rec-message--error' : ''}`} role="status">
            {message.text}
          </p>
        )}
        <div className="rec-danger">
          <button type="button" className="rec-clear" onClick={handleClear}>
            記録をすべて消す
          </button>
        </div>
      </section>
    </>
  )
}

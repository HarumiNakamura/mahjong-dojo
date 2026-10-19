import { useMemo, useState } from 'react'
import { Link } from '../../app/Link'
import { loadPaipuRecords } from '../../app/paipuStore'
import { readQuery } from '../../app/router'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { fromPai, handView } from '../../game/convert'
import type { PaipuRecord } from '../../game/paipuRecords'
import {
  actorOf,
  boardAt,
  clampScene,
  describeStep,
  kyokuCount,
  kyokuLabel,
  kyokuResult,
  lastStep,
  myDiscardSteps,
  mySeat,
  replayUrl,
  type ReplayScene,
} from '../../game/replay'
import { formatPoints } from '../../game/result'
import { MeldTiles, River } from './BoardParts'
import './play.css'
import '../pages.css'

const WINDS = ['東', '南', '西', '北']

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 保存している牌譜の一覧 */
function ReplayList({ records }: { records: readonly PaipuRecord[] }) {
  if (!records.length) {
    return (
      <p>
        まだ牌譜がありません。<Link to="/play">CPU対戦</Link>で半荘を打ち終えると、ここに保存されます(新しい20半荘まで)。
      </p>
    )
  }
  return (
    <ul className="replay-list">
      {[...records].reverse().map((r) => (
        <li key={r.id}>
          <Link to={replayUrl(r.id)} className="replay-list-link">
            {formatDate(r.playedAt)} {r.paipu.rank[0]}位 {r.paipu.defen[0].toLocaleString('ja-JP')}点
            {r.paipu.point?.[0] !== undefined && `(${formatPoints(Math.round(Number(r.paipu.point[0]) * 10))})`}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** 牌譜の再生(/play/replay?g=<対局>&k=<局>&s=<手数>&v=all) */
export function ReplayPage() {
  const [records] = useState(loadPaipuRecords)
  const [initial] = useState(() => {
    const q = readQuery()
    return { id: q.get('g'), kyoku: Number(q.get('k') ?? 0), step: Number(q.get('s') ?? 0), showAll: q.get('v') === 'all' }
  })
  const record = records.find((r) => r.id === initial.id)
  const [scene, setSceneState] = useState<ReplayScene>(() =>
    record ? clampScene(record.paipu, { kyoku: initial.kyoku, step: initial.step }) : { kyoku: 0, step: 0 },
  )
  const [showAll, setShowAllState] = useState(initial.showAll)
  const [copied, setCopied] = useState(false)

  const board = useMemo(() => (record ? boardAt(record.paipu, scene) : null), [record, scene])

  if (!initial.id) {
    return (
      <>
        <h1 className="page-title">CPU対戦の牌譜</h1>
        <ReplayList records={records} />
      </>
    )
  }
  if (!record || !board) {
    return (
      <>
        <h1 className="page-title">CPU対戦の牌譜</h1>
        <p>この牌譜は見つかりませんでした。牌譜はこの端末のブラウザに、新しい20半荘まで保存されます。</p>
        <ReplayList records={records} />
      </>
    )
  }

  const paipu = record.paipu
  // URL も今の場面に合わせる(そのまま共有・ブックマークできる)
  const go = (next: ReplayScene, all = showAll) => {
    const s = clampScene(paipu, next)
    setSceneState(s)
    setCopied(false)
    window.history.replaceState(null, '', replayUrl(record.id, s, all))
  }
  const setShowAll = (v: boolean) => {
    setShowAllState(v)
    go(scene, v)
  }
  const last = lastStep(paipu, scene.kyoku)
  const nextMine = myDiscardSteps(paipu, scene.kyoku).find((i) => i > scene.step)
  const me = mySeat(paipu, scene.kyoku)
  const actor = actorOf(paipu, scene)
  const scoreOf = (l: number) => board.defen[board.player_id[l]]

  const seat = (l: number, mine: boolean) => {
    const shoupai = board.shoupai[l]
    const v = handView(shoupai.toString())
    const showHand = mine || showAll
    return (
      <div key={l} className={mine ? 'play-me' : `play-seat play-seat--${(l - me + 4) % 4}`}>
        <p className="play-seat-name">
          <span className="play-wind">{WINDS[l]}</span>
          {paipu.player[board.player_id[l]]}
          <span className="play-score">{scoreOf(l).toLocaleString('ja-JP')}</span>
          {shoupai.lizhi && <span className="play-tag">リーチ</span>}
          {actor === l && <span className="play-say">手番</span>}
        </p>
        {!mine && shoupai._fulou.length > 0 && (
          <div className="play-melds">
            {shoupai._fulou.map((m, i) => (
              <MeldTiles key={i} m={m} size="small" />
            ))}
          </div>
        )}
        <River pai={board.he[l]._pai} large={false} />
        {showHand && (
          <div className={mine ? 'play-hand' : 'replay-hand--small'}>
            <Hand tiles={v.tiles} drawn={v.drawn} />
            {mine && shoupai._fulou.length > 0 && (
              <div className="play-my-melds">
                {shoupai._fulou.map((m, i) => (
                  <MeldTiles key={i} m={m} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + replayUrl(record.id, scene, showAll))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="play replay">
      <h1 className="page-title">牌譜({formatDate(record.playedAt)})</h1>
      <div className="replay-controls-top">
        <label className="replay-select">
          局
          <select value={scene.kyoku} onChange={(e) => go({ kyoku: Number(e.target.value), step: 0 })}>
            {Array.from({ length: kyokuCount(paipu) }, (_, k) => (
              <option key={k} value={k}>
                {kyokuLabel(paipu, k)} {kyokuResult(paipu, k)}
              </option>
            ))}
          </select>
        </label>
        <label className="replay-toggle">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          全員の手牌を見る
        </label>
        <button type="button" className="button replay-small-button" onClick={copyUrl}>
          {copied ? 'コピーしました' : 'この場面のURLをコピー'}
        </button>
      </div>

      <div className="play-info">
        <span className="play-round">
          {WINDS[board.zhuangfeng]}
          {board.jushu + 1}局
        </span>
        <span>{board.changbang}本場</span>
        <span>供託 {board.lizhibang}</span>
        <span className="play-dora">
          ドラ表示
          {board.shan.baopai.map((p, i) => (
            <Tile key={i} tile={fromPai(p)} showLabel={false} />
          ))}
        </span>
        <span>残り {board.shan.paishu}枚</span>
      </div>

      <div className="play-board">{[2, 3, 1].map((d) => seat((me + d) % 4, false))}</div>
      {seat(me, true)}

      <div className="play-actions replay-actions">
        <p className="replay-step" aria-live="polite">
          {scene.step}/{last}手 {describeStep(paipu, scene, showAll)}
        </p>
        <button type="button" className="button" disabled={scene.step === 0} onClick={() => go({ ...scene, step: scene.step - 1 })}>
          ◀ 戻る
        </button>
        <button type="button" className="button button--primary" disabled={scene.step >= last} onClick={() => go({ ...scene, step: scene.step + 1 })}>
          進む ▶
        </button>
        <button type="button" className="button" disabled={nextMine === undefined} onClick={() => nextMine !== undefined && go({ ...scene, step: nextMine })}>
          自分の番
        </button>
        <button type="button" className="button" disabled={scene.step >= last} onClick={() => go({ ...scene, step: last })}>
          局の最後
        </button>
      </div>
    </div>
  )
}

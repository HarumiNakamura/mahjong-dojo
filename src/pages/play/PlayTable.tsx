import { useState, useSyncExternalStore } from 'react'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { fromPai, handView } from '../../game/convert'
import { discardHints } from '../../game/hints'
import { MeldTiles, River } from './BoardParts'
import type { HumanReply } from '../../game/humanPlayer'
import { PLAYER_NAMES, type GameSession } from '../../game/session'
import { tileName, type Tile as TileData } from '../../engine/tiles'

const WINDS = ['東', '南', '西', '北']
const SAY_LABELS: Record<string, string> = { chi: 'チー', peng: 'ポン', gang: 'カン', lizhi: 'リーチ', rong: 'ロン', zimo: 'ツモ' }
/** 自分から見た席の名前(l の差) */
const SEAT_LABELS = ['自分', '下家', '対面', '上家']

/** 手牌の牌を、majiang-core の打牌の表記(ツモ切りは '_' 付き)にする */
function dapaiOf(tile: TileData, isDrawn: boolean, options: readonly string[]): string | null {
  const s = tile.kind < 9 ? 'm' : tile.kind < 18 ? 'p' : tile.kind < 27 ? 's' : 'z'
  const n = tile.red ? 0 : (tile.kind % 9) + 1
  const p = `${s}${n}`
  if (isDrawn && options.includes(`${p}_`)) return `${p}_`
  if (options.includes(p)) return p
  return null
}

/** 練習モードのヒント(牌効率のよい打牌と、リーチ者に対する危険度) */
function HintPanel({ session }: { session: GameSession }) {
  const { human } = session
  const hints = discardHints(human.model, human._menfeng, human.orders)
  if (!hints.length) return null
  const name = (k: number) => tileName({ kind: k, red: false })
  const top = hints.slice(0, 3)
  const withDanger = hints.some((h) => h.danger !== null)
  const safest = withDanger ? [...hints].sort((a, b) => a.danger! - b.danger! || a.kind - b.kind)[0] : null
  const shantenWord = (n: number) => (n === 0 ? 'テンパイ' : `${n}シャンテン`)
  return (
    <div className="play-hints" aria-label="ヒント">
      <p className="play-hints-title">ヒント(練習モード)</p>
      <ul>
        {top.map((h) => (
          <li key={h.kind} className={h.best ? 'play-hints-best' : ''}>
            {name(h.kind)}切り:{shantenWord(h.shanten)}・{h.shanten === 0 ? '待ち' : '受け入れ'}{h.ukeire}枚
            {h.danger !== null && `・危険度 約${h.danger}%`}
          </li>
        ))}
      </ul>
      {safest && (
        <p className="play-hints-safe">
          一番安全:{name(safest.kind)}({safest.dangerLabel}・約{safest.danger}%)
        </p>
      )}
    </div>
  )
}

export function PlayTable({ session }: { session: GameSession }) {
  const { human } = session
  useSyncExternalStore(
    (fn) => human.subscribe(fn),
    () => human.version,
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [lizhiMode, setLizhiMode] = useState(false)
  const [choice, setChoice] = useState<{ kind: 'chi' | 'peng' | 'gang'; options: string[] } | null>(null)
  const [enlarged, setEnlarged] = useState(false)
  const [marked, setMarked] = useState(false)

  const model = human.model
  if (!model.shan) return <p className="page-loading">配牌中…</p>
  const me = human._menfeng
  const req = human.request
  const reply = (r: HumanReply) => {
    setSelected(null)
    setLizhiMode(false)
    setChoice(null)
    human.reply(r)
  }

  // 自分の手牌
  const view = handView(model.shoupai[me].toString())
  const all = view.drawn ? [...view.tiles, view.drawn] : view.tiles
  const discardOptions = req?.kind === 'zimo' ? (lizhiMode ? req.lizhi : req.dapai) : req?.kind === 'fulou' ? req.dapai : []
  const canDiscard = (i: number) => dapaiOf(all[i], view.drawn !== null && i === all.length - 1, discardOptions) !== null
  const onTile = (i: number) => {
    if (!canDiscard(i)) return
    if (selected !== i) return setSelected(i)
    const p = dapaiOf(all[i], view.drawn !== null && i === all.length - 1, discardOptions)!
    reply({ dapai: lizhiMode ? `${p}*` : p })
  }

  const say = session.lastSay
  const seat = (d: number) => (me + d) % 4
  const scoreOf = (l: number) => model.defen[model.player_id[l]]

  const opponent = (d: number) => {
    const l = seat(d)
    const shoupai = model.shoupai[l]
    return (
      <div className={`play-seat play-seat--${d}`}>
        <p className="play-seat-name">
          <span className="play-wind">{WINDS[l]}</span>
          {PLAYER_NAMES[model.player_id[l]]}
          <span className="play-score">{scoreOf(l).toLocaleString('ja-JP')}</span>
          {shoupai.lizhi && <span className="play-tag">リーチ</span>}
          {say?.l === l && <span className="play-say">{SAY_LABELS[say.name] ?? say.name}</span>}
        </p>
        {shoupai._fulou.length > 0 && (
          <div className="play-melds">
            {shoupai._fulou.map((m, i) => (
              <MeldTiles key={i} m={m} size="small" />
            ))}
          </div>
        )}
        <River pai={model.he[l]._pai} large={enlarged} />
      </div>
    )
  }

  return (
    <div className="play">
      <div className="play-info">
        <span className="play-round">
          {WINDS[model.zhuangfeng]}
          {model.jushu + 1}局
        </span>
        <span>{model.changbang}本場</span>
        <span>供託 {model.lizhibang}</span>
        <span className="play-dora">
          ドラ表示
          {model.shan.baopai.map((p, i) => (
            <Tile key={i} tile={fromPai(p)} showLabel={false} />
          ))}
        </span>
        <span>残り {model.shan.paishu}枚</span>
        <button type="button" className="play-zoom" aria-pressed={enlarged} onClick={() => setEnlarged((v) => !v)}>
          {enlarged ? '河を戻す' : '河を拡大'}
        </button>
        <button
          type="button"
          className="play-zoom play-mark"
          onClick={() => {
            if (!session.game.mark()) return
            setMarked(true)
            setTimeout(() => setMarked(false), 1500)
          }}
        >
          {marked ? '✓ 印をつけました' : `この判断を後で見る${session.game.marks.length ? `(${session.game.marks.length})` : ''}`}
        </button>
      </div>

      <div className={`play-board${enlarged ? ' play-board--large' : ''}`}>
        {opponent(2)}
        {opponent(3)}
        {opponent(1)}
      </div>

      <div className="play-me">
        <p className="play-seat-name">
          <span className="play-wind">{WINDS[me]}</span>
          あなた
          <span className="play-score">{scoreOf(me).toLocaleString('ja-JP')}</span>
          {model.shoupai[me].lizhi && <span className="play-tag">リーチ</span>}
          {say?.l === me && <span className="play-say">{SAY_LABELS[say.name] ?? say.name}</span>}
        </p>
        <River pai={model.he[me]._pai} large={enlarged} />
        <div className="play-hand">
          <Hand
            tiles={view.tiles}
            drawn={view.drawn}
            selected={selected}
            onSelect={discardOptions.length ? onTile : undefined}
            isDisabled={discardOptions.length ? (i) => !canDiscard(i) : undefined}
          />
          {view.melds.length > 0 && (
            <div className="play-my-melds">
              {model.shoupai[me]._fulou.map((m, i) => (
                <MeldTiles key={i} m={m} />
              ))}
            </div>
          )}
        </div>
        {session.practice && discardOptions.length > 0 && <HintPanel session={session} />}
        <p className="play-hint" aria-live="polite">
          {lizhiMode
            ? 'リーチ:切る牌をタップで選び、もう一度タップで決定'
            : discardOptions.length
              ? '切る牌をタップで選び、もう一度タップで決定'
              : req?.kind === 'dapai'
                ? `${SEAT_LABELS[(4 + model.lunban - me) % 4]}の${tileName(fromPai(req.pai.slice(0, 2)))}を鳴けます`
                : ''}
        </p>
      </div>

      <div className="play-actions">
        {choice ? (
          <>
            {choice.options.map((m) => (
              <button key={m} type="button" className="button play-choice" onClick={() => reply(choice.kind === 'gang' ? { gang: m } : { fulou: m })}>
                <MeldTiles m={m} />
              </button>
            ))}
            <button type="button" className="button" onClick={() => setChoice(null)}>
              戻る
            </button>
          </>
        ) : req?.kind === 'zimo' ? (
          <>
            {req.hule && (
              <button type="button" className="button button--primary" onClick={() => reply({ hule: '-' })}>
                ツモ
              </button>
            )}
            {req.lizhi.length > 0 && (
              <button type="button" className="button" aria-pressed={lizhiMode} onClick={() => { setLizhiMode((v) => !v); setSelected(null) }}>
                {lizhiMode ? 'リーチをやめる' : 'リーチ'}
              </button>
            )}
            {req.gang.length > 0 && (
              <button
                type="button"
                className="button"
                onClick={() => (req.gang.length === 1 ? reply({ gang: req.gang[0] }) : setChoice({ kind: 'gang', options: req.gang }))}
              >
                カン
              </button>
            )}
            {req.inLizhi && !req.hule && req.gang.length === 0 && (
              <button type="button" className="button" onClick={() => reply({ dapai: req.dapai[req.dapai.length - 1] })}>
                ツモ切り
              </button>
            )}
          </>
        ) : req?.kind === 'dapai' ? (
          <>
            {req.hule && (
              <button type="button" className="button button--primary" onClick={() => reply({ hule: '-' })}>
                ロン
              </button>
            )}
            {req.chi.length > 0 && (
              <button type="button" className="button" onClick={() => (req.chi.length === 1 ? reply({ fulou: req.chi[0] }) : setChoice({ kind: 'chi', options: req.chi }))}>
                チー
              </button>
            )}
            {req.peng.length > 0 && (
              <button type="button" className="button" onClick={() => (req.peng.length === 1 ? reply({ fulou: req.peng[0] }) : setChoice({ kind: 'peng', options: req.peng }))}>
                ポン
              </button>
            )}
            {req.gang.length > 0 && (
              <button type="button" className="button" onClick={() => reply({ fulou: req.gang[0] })}>
                カン
              </button>
            )}
            <button type="button" className="button" onClick={() => reply({})}>
              スルー
            </button>
          </>
        ) : req?.kind === 'qianggang' ? (
          <>
            <button type="button" className="button button--primary" onClick={() => reply({ hule: '-' })}>
              ロン(搶槓)
            </button>
            <button type="button" className="button" onClick={() => reply({})}>
              スルー
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

// 現物・スジ・壁:スジのしくみ・壁とノーチャンス
import { TILE_RATIO, tilesWidth, useArrowId } from './geometry'
import { ArrowHead, FigCross, FigText, FigTile, FigTiles } from './parts'

/** 段の番号(丸に数字) */
function StepNo({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} className="fig-fill-accent" />
      <FigText x={x} y={y + 5} size={13} tone="contrast" bold>
        {n}
      </FigText>
    </g>
  )
}

/** 下向きの矢印(段のあいだ) */
function Down({ y, url }: { y: number; url: string }) {
  return <line x1={180} y1={y} x2={180} y2={y + 18} className="fig-line fig-line--thick" markerEnd={url} />
}

/** 「4萬が現物 → 23萬・56萬の両面待ちが消える → 1萬と7萬が通りやすい」 */
export function SujiFigure() {
  const arrow = useArrowId()
  const w = 30
  const th = w * TILE_RATIO
  return (
    <svg viewBox="0 0 360 372" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      {/* 1. 現物 */}
      <rect x={6} y={6} width={348} height={70} rx={6} className="fig-panel" />
      <StepNo x={24} y={26} n={1} />
      <FigTile tile="4m" x={44} y={18} w={34} />
      <FigText x={92} y={36} size={14} anchor="start" bold>
        4萬はリーチした人の河にある
      </FigText>
      <FigText x={92} y={58} size={13} anchor="start" tone="accent" bold>
        = 現物(4萬では当たらない)
      </FigText>
      <Down y={80} url={arrow.url} />
      {/* 2. 両面待ちが消える */}
      <rect x={6} y={104} width={348} height={134} rx={6} className="fig-panel" />
      <StepNo x={24} y={124} n={2} />
      <FigText x={44} y={130} size={14} anchor="start" bold>
        4萬でも当たる両面待ちは、ない
      </FigText>
      {[
        { tiles: '23m', wait: '1・4萬待ち', x: 34 },
        { tiles: '56m', wait: '4・7萬待ち', x: 196 },
      ].map((s) => (
        <g key={s.tiles}>
          <FigTiles tiles={s.tiles} x={s.x + 30} y={146} w={w} />
          <FigCross x={s.x + 26} y={146} w={tilesWidth(2, w) + 8} h={th} />
          <FigText x={s.x + 30 + w} y={208} size={13} tone="muted">
            {s.wait}
          </FigText>
        </g>
      ))}
      <FigText x={180} y={230} size={12} tone="muted">
        待っていても4萬はフリテンでロンできないため
      </FigText>
      <Down y={242} url={arrow.url} />
      {/* 3. スジが通りやすい */}
      <rect x={6} y={266} width={348} height={100} rx={6} className="fig-panel fig-panel--ok" />
      <StepNo x={24} y={286} n={3} />
      <FigTile tile="1m" x={44} y={278} w={34} />
      <FigTile tile="7m" x={82} y={278} w={34} />
      <FigText x={128} y={296} size={14} anchor="start" tone="correct" bold>
        1萬と7萬は通りやすい
      </FigText>
      <FigText x={128} y={316} size={12} anchor="start" tone="muted">
        (両面待ちには当たらない)
      </FigText>
      <FigText x={180} y={352} size={12}>
        ※ 嵌張・シャンポン・単騎の待ちには当たることがある
      </FigText>
    </svg>
  )
}

/** 壁(8萬が4枚見えている)と、9萬のノーチャンス */
export function KabeFigure() {
  const arrow = useArrowId()
  const w = 30
  const th = w * TILE_RATIO
  return (
    <svg viewBox="0 0 360 304" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      <rect x={6} y={6} width={348} height={86} rx={6} className="fig-panel" />
      <FigTiles tiles="8888m" x={20} y={22} w={w} gap={4} />
      <FigText x={160} y={40} size={14} anchor="start" bold>
        8萬が4枚とも見えている
      </FigText>
      <FigText x={160} y={60} size={12} anchor="start" tone="muted">
        (河・ドラ表示牌・自分の手牌)
      </FigText>
      <FigText x={160} y={80} size={13} anchor="start" tone="accent" bold>
        = 壁
      </FigText>
      <line x1={180} y1={96} x2={180} y2={114} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <rect x={6} y={118} width={348} height={70} rx={6} className="fig-panel" />
      <FigTiles tiles="78m" x={30} y={130} w={w} />
      <FigCross x={26} y={130} w={tilesWidth(2, w) + 8} h={th} />
      <FigText x={110} y={148} size={14} anchor="start" bold>
        78萬の両面(6・9萬待ち)は作れない
      </FigText>
      <FigText x={110} y={170} size={12} anchor="start" tone="muted">
        だれも8萬を持てないため
      </FigText>
      <line x1={180} y1={192} x2={180} y2={210} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <rect x={6} y={214} width={348} height={84} rx={6} className="fig-panel fig-panel--ok" />
      <FigTile tile="9m" x={30} y={226} w={34} />
      <FigText x={80} y={246} size={14} anchor="start" tone="correct" bold>
        9萬はノーチャンス
      </FigText>
      <FigText x={80} y={266} size={12} anchor="start" tone="muted">
        両面待ちには当たらない
      </FigText>
      <FigText x={80} y={286} size={12} anchor="start" tone="muted">
        8萬が3枚見え(残り1枚)ならワンチャンス
      </FigText>
    </svg>
  )
}

const LADDER = [
  { label: '現物', note: 'リーチ者の河・リーチ後に通った牌' },
  { label: '字牌', note: '3枚見え → 2枚見え' },
  { label: 'スジ・壁', note: '両スジ・1と9のスジ・ノーチャンス' },
  { label: 'ワンチャンス・片スジ', note: '両面待ちが少し残る' },
  { label: '無スジ', note: '最後の手段' },
]

/** ベタオリで安全な牌を切る順番(はしご) */
export function BetaoriLadderFigure() {
  const arrow = useArrowId()
  const top = 30
  const rowH = 52
  return (
    <svg viewBox="0 0 360 306" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      <FigText x={20} y={18} size={12} tone="correct" anchor="start" bold>
        先に切る(安全)
      </FigText>
      <line x1={26} y1={top + 4} x2={26} y2={top + rowH * LADDER.length - 12} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      <FigText x={20} y={top + rowH * LADDER.length + 6} size={12} tone="accent" anchor="start" bold>
        後に切る(危険)
      </FigText>
      {LADDER.map((r, i) => {
        const y = top + i * rowH
        // 危険なほど右へのびる帯
        const w = 24 + i * 66
        return (
          <g key={r.label}>
            <rect x={48} y={y} width={300} height={rowH - 8} rx={4} className="fig-box" />
            <rect x={52} y={y + rowH - 14} width={w} height={4} rx={2} className={i === 0 ? 'fig-safe' : 'fig-danger'} />
            <FigText x={58} y={y + 17} size={14} anchor="start" bold>
              {`${i + 1}. ${r.label}`}
            </FigText>
            <FigText x={58} y={y + 31} size={11} anchor="start" tone="muted">
              {r.note}
            </FigText>
          </g>
        )
      })}
    </svg>
  )
}

const TURNS = [
  { who: '自分', act: '打牌', tile: '', state: '' },
  { who: '下家', act: '1索を切る', tile: '1s', state: '見逃し' },
  { who: '対面', act: '4索を切る', tile: '4s', state: 'ロン不可' },
  { who: '上家', act: '1索を切る', tile: '1s', state: 'ロン不可' },
  { who: '自分', act: 'ツモ番', tile: '', state: '解除' },
]

/** 同巡内フリテン(1・4索待ち):見逃してから自分の番が来るまでロンできない */
export function FuritenTurnFigure() {
  const arrow = useArrowId()
  const x0 = 12
  const step = 68
  const w = 30
  return (
    <svg viewBox="0 0 360 196" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      {/* フリテンの期間 */}
      <rect x={x0 + step - 4} y={8} width={step * 3 + 4} height={150} rx={6} className="fig-zone-fold" />
      <FigText x={x0 + step * 2.5} y={26} size={12} tone="accent" bold>
        同巡内フリテン(ロンできない)
      </FigText>
      {TURNS.map((t, i) => {
        const x = x0 + i * step
        const cx = x + 30
        return (
          <g key={i}>
            <FigText x={cx} y={52} size={14} bold>
              {t.who}
            </FigText>
            <FigText x={cx} y={70} size={11} tone="muted">
              {t.act}
            </FigText>
            {t.tile ? <FigTile tile={t.tile} x={cx - w / 2} y={80} w={w} /> : <circle cx={cx} cy={100} r={6} className="fig-fill-text" />}
            {t.state && (
              <FigText x={cx} y={146} size={12} tone={t.state === '解除' ? 'correct' : t.state === '見逃し' ? 'text' : 'accent'} bold>
                {t.state}
              </FigText>
            )}
            {i < TURNS.length - 1 && <line x1={cx + 22} y1={100} x2={cx + step - 22} y2={100} className="fig-line" markerEnd={arrow.url} />}
          </g>
        )
      })}
      <FigText x={180} y={184} size={12} tone="muted">
        自分の待ち:1索・4索。ツモアガリはいつでもできる
      </FigText>
    </svg>
  )
}

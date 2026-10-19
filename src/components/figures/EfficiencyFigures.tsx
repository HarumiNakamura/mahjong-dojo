// 牌効率の基本:孤立牌を切る順番・5筒と1筒のくっつきやすさ
import { TILE_RATIO, useArrowId } from './geometry'
import { ArrowHead, FigCross, FigText, FigTile } from './parts'

const ORDER = [
  { tile: '4z', label: 'オタ風', note: '例:北' },
  { tile: '6z', label: '役牌', note: '例:發' },
  { tile: '9m', label: '1・9', note: '' },
  { tile: '2p', label: '2・8', note: '' },
  { tile: '5s', label: '3〜7', note: '' },
]

/** 孤立牌を切る順番の帯(先に切る → 後に切る) */
export function DiscardOrderFigure() {
  const arrow = useArrowId()
  const w = 40
  const step = 70
  const x0 = 20
  return (
    <svg viewBox="0 0 360 168" className="fig-svg">
      <defs>
        <ArrowHead id={arrow.id} />
      </defs>
      <FigText x={18} y={22} size={13} anchor="start" tone="accent" bold>
        先に切る
      </FigText>
      <FigText x={342} y={22} size={13} anchor="end" bold>
        後に切る
      </FigText>
      <line x1={86} y1={18} x2={270} y2={18} className="fig-line fig-line--thick" markerEnd={arrow.url} />
      {ORDER.map((o, i) => {
        const x = x0 + i * step
        return (
          <g key={o.tile}>
            <rect x={x - 6} y={34} width={w + 12} height={w * TILE_RATIO + 12} rx={4} className={i === 0 ? 'fig-box fig-box--accent' : 'fig-box'} />
            <FigTile tile={o.tile} x={x} y={40} w={w} />
            <FigText x={x + w / 2} y={118} size={14} bold>
              {o.label}
            </FigText>
            {o.note && (
              <FigText x={x + w / 2} y={136} size={12} tone="muted">
                {o.note}
              </FigText>
            )}
          </g>
        )
      })}
      <FigText x={180} y={160} size={12} tone="muted">
        右ほど、ほかの牌とくっついて面子になりやすい
      </FigText>
    </svg>
  )
}

const ROWS = [
  {
    base: '5p',
    name: '5筒',
    cands: [
      { tile: '3p', shape: '嵌張' },
      { tile: '4p', shape: '両面' },
      { tile: '5p', shape: '対子' },
      { tile: '6p', shape: '両面' },
      { tile: '7p', shape: '嵌張' },
    ],
    count: '5種類',
  },
  {
    base: '1p',
    name: '1筒',
    cands: [
      { tile: '1p', shape: '対子' },
      { tile: '2p', shape: '辺張' },
      { tile: '3p', shape: '嵌張' },
      { tile: '4p', shape: '' },
      { tile: '5p', shape: '' },
    ],
    count: '3種類だけ',
  },
]

/** 5筒には3〜7筒がくっつき、1筒には1〜3筒しかくっつかない */
export function ConnectFigure() {
  const bw = 40
  const cw = 34
  const cx0 = 104
  const cstep = 48
  const rowH = 128
  return (
    <svg viewBox="0 0 360 250" className="fig-svg">
      {ROWS.map((r, ri) => {
        const y = 14 + ri * rowH
        const by = y + 22
        return (
          <g key={r.base}>
            <FigText x={14 + bw / 2} y={y + 12} size={13} bold>
              {r.name}
            </FigText>
            <rect x={8} y={by - 6} width={bw + 12} height={bw * TILE_RATIO + 12} rx={4} className="fig-box fig-box--accent" />
            <FigTile tile={r.base} x={14} y={by} w={bw} />
            <FigText x={80} y={by + 34} size={22} tone="muted">
              ＋
            </FigText>
            {r.cands.map((c, i) => {
              const x = cx0 + i * cstep
              const ok = c.shape !== ''
              return (
                <g key={i}>
                  <FigTile tile={c.tile} x={x} y={y + 18} w={cw} faded={!ok} />
                  {ok ? (
                    <FigText x={x + cw / 2} y={y + 18 + cw * TILE_RATIO + 16} size={12} tone="accent" bold>
                      {c.shape}
                    </FigText>
                  ) : (
                    <FigCross x={x + 6} y={y + 26} w={cw - 12} h={cw - 12} />
                  )}
                </g>
              )
            })}
            <FigText x={cx0 - 8} y={y + 104} size={13} anchor="start">
              くっつく牌:
            </FigText>
            <FigText x={cx0 + 70} y={y + 104} size={14} anchor="start" tone={ri === 0 ? 'correct' : 'accent'} bold>
              {r.count}
            </FigText>
          </g>
        )
      })}
    </svg>
  )
}

import { useState } from 'react'
import { Discards } from '../../components/tile/Discards'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { UkeireBoard } from '../../components/tile/UkeireBoard'
import { DIFFICULTIES, type EfficiencyQuestion } from '../../engine/efficiencyQuestion'
import { shantenLabel } from '../../engine/efficiencyExplain'
import { tileName } from '../../engine/tiles'

interface Props {
  question: EfficiencyQuestion
  answered: boolean
  /** 回答した牌の種類 */
  answer: number | null
  onAnswer: (kind: number) => void
}

const SEATS = ['下家', '対面', '上家']

export function EfficiencyQuestionView({ question, answered, answer, onAnswer }: Props) {
  const [previewed, setPreviewed] = useState<number | null>(null)
  const all = [...question.hand, question.drawn]
  const previewTile = previewed === null ? null : all[previewed]
  const option = previewTile ? question.judgement.analysis.options.find((o) => o.tile.kind === previewTile.kind) : null
  const answeredIndex = answer === null ? null : all.findIndex((t) => t.kind === answer)
  const label = DIFFICULTIES.find((d) => d.id === question.difficulty)?.label

  return (
    <div className="eff">
      <div className="eff-meta">
        <span className="badge">{label}</span>
        <span>{question.turn}巡目</span>
        <span className="eff-dora">
          ドラ表示牌
          <span className="eff-dora-tile">
            <Tile tile={question.doraIndicator} />
          </span>
        </span>
      </div>

      <p className="drill-prompt">何を切りますか?</p>
      <Hand
        tiles={question.hand}
        drawn={question.drawn}
        selected={answeredIndex}
        previewed={previewed}
        onSelect={(i) => {
          if (!answered) onAnswer(all[i].kind)
        }}
        onPreview={setPreviewed}
      />
      <p className="eff-hint">
        {answered
          ? '牌を長押し(PCはマウスを乗せる)すると、ほかの打牌の有効牌も確かめられます。'
          : '切る牌をタップして回答します。長押し(PCはマウスを乗せる)で、その牌を切ったときの有効牌が光ります。'}
      </p>

      <div className="eff-preview" aria-live="polite">
        {option ? (
          <p className="eff-preview-text">
            <strong>{tileName(option.tile)}切り</strong>:{shantenLabel(option.shanten)}・受け入れ
            <strong>
              {option.tiles.length}種{option.total}枚
            </strong>
          </p>
        ) : (
          <p className="eff-preview-text eff-preview-text--empty">牌を長押しすると、ここに有効牌が表示されます</p>
        )}
        <UkeireBoard tiles={option?.tiles ?? []} />
      </div>

      <div className="eff-rivers">
        <p className="eff-rivers-title">自分の河</p>
        {question.ownDiscards.length > 0 ? <Discards tiles={question.ownDiscards} /> : <p className="eff-none">まだありません</p>}
        <details className="eff-others">
          <summary>他の人の河を見る(残り枚数の計算に使っています)</summary>
          {question.otherDiscards.map((river, i) => (
            <div key={i} className="eff-other">
              <p className="eff-rivers-title">{SEATS[i]}</p>
              {river.length > 0 ? <Discards tiles={river} /> : <p className="eff-none">まだありません</p>}
            </div>
          ))}
        </details>
      </div>
    </div>
  )
}

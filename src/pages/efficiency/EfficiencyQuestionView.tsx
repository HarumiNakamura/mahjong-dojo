import { useState } from 'react'
import { Discards } from '../../components/tile/Discards'
import { Hand } from '../../components/tile/Hand'
import { Tile } from '../../components/tile/Tile'
import { UkeireBoard } from '../../components/tile/UkeireBoard'
import { DIFFICULTIES, type EfficiencyQuestion } from '../../engine/efficiencyQuestion'
import { shantenLabel } from '../../engine/efficiencyExplain'
import { tileName } from '../../engine/tiles'
import type { DiscardOption } from '../../engine/ukeire'

interface Props {
  question: EfficiencyQuestion
  answered: boolean
  /** 回答した牌の種類 */
  answer: number | null
  onAnswer: (kind: number) => void
}

const SEATS = ['下家', '対面', '上家']

/** 打牌1つの有効牌(シャンテン数・受け入れ枚数と、有効牌の一覧) */
function OptionBoard({ title, option }: { title: string; option: DiscardOption }) {
  return (
    <div className="eff-option">
      <p className="eff-preview-text">
        <strong>{title}</strong>:{shantenLabel(option.shanten)}・受け入れ
        <strong>
          {option.tiles.length}種{option.total}枚
        </strong>
      </p>
      <UkeireBoard tiles={option.tiles} />
    </div>
  )
}

export function EfficiencyQuestionView({ question, answered, answer, onAnswer }: Props) {
  const [previewed, setPreviewed] = useState<number | null>(null)
  // 有効牌の一覧(ヒント)は、回答前は畳んでおく
  const [hintOpen, setHintOpen] = useState(false)
  const all = [...question.hand, question.drawn]
  const previewTile = previewed === null ? null : all[previewed]
  const option = previewTile ? question.judgement.analysis.options.find((o) => o.tile.kind === previewTile.kind) : null
  const answeredIndex = answer === null ? null : all.findIndex((t) => t.kind === answer)
  const options = question.judgement.analysis.options
  const chosen = answer === null ? null : (options.find((o) => o.tile.kind === answer) ?? null)
  const best = question.judgement.best
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
      {answered ? (
        <Hand tiles={question.hand} drawn={question.drawn} selected={answeredIndex} previewed={previewed} onSelect={() => {}} onPreview={setPreviewed} full />
      ) : (
        <Hand tiles={question.hand} drawn={question.drawn} previewed={previewed} onPick={(i) => onAnswer(all[i].kind)} onPreview={hintOpen ? setPreviewed : undefined} />
      )}
      {answered ? (
        <div className="eff-preview" aria-live="polite">
          {option ? (
            <OptionBoard title={`${tileName(option.tile)}切り(長押しした牌)`} option={option} />
          ) : (
            <>
              {chosen && <OptionBoard title={`あなた:${tileName(chosen.tile)}切り`} option={chosen} />}
              {best && best.tile.kind !== chosen?.tile.kind && <OptionBoard title={`最善:${tileName(best.tile)}切り`} option={best} />}
            </>
          )}
          <p className="eff-hint">牌を長押し(PCはマウスを乗せる)すると、ほかの打牌の有効牌も確かめられます。</p>
        </div>
      ) : hintOpen ? (
        <div className="eff-preview" aria-live="polite">
          <p className="eff-hint">長押し(PCはマウスを乗せる)で、その牌を切ったときの有効牌が光ります。</p>
          {option ? (
            <OptionBoard title={`${tileName(option.tile)}切り`} option={option} />
          ) : (
            <>
              <p className="eff-preview-text eff-preview-text--empty">牌を長押しすると、ここに有効牌が表示されます</p>
              <UkeireBoard tiles={[]} />
            </>
          )}
          <button type="button" className="eff-hint-toggle" onClick={() => setHintOpen(false)}>
            ヒントを閉じる
          </button>
        </div>
      ) : (
        <button type="button" className="button button--block eff-hint-open" onClick={() => setHintOpen(true)}>
          ヒントを見る(有効牌の一覧)
        </button>
      )}

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

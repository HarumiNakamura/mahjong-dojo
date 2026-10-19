// 記事の図解(SVG 部品)の一覧。題名と代替テキストは src/content/figures.ts、記事への埋め込みは ArticleFigure.tsx
import type { ComponentType } from 'react'
import { DiscardOrderFigure, ConnectFigure } from './EfficiencyFigures'
import { BetaoriLadderFigure, FuritenTurnFigure, KabeFigure, SujiFigure } from './DefenseFigures'
import { FlowHanchanFigure, FlowTableFigure } from './FlowFigures'
import { FuStackFigure, PushFoldAxesFigure } from './JudgeFigures'

export const FIGURE_COMPONENTS: Record<string, ComponentType> = {
  'flow-table': FlowTableFigure,
  'flow-hanchan': FlowHanchanFigure,
  'efficiency-discard-order': DiscardOrderFigure,
  'efficiency-connect': ConnectFigure,
  'safe-suji': SujiFigure,
  'safe-kabe': KabeFigure,
  'betaori-ladder': BetaoriLadderFigure,
  'furiten-turn': FuritenTurnFigure,
  'fu-stack': FuStackFigure,
  'pushfold-axes': PushFoldAxesFigure,
}

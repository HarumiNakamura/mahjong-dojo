import type { ReactNode } from 'react'
import type { DrillResult, QuestionViewProps } from '../components/drill/Drill'

/**
 * ドリルの定義。学習記録・解き直し・お気に入りは、この定義を通して共通の仕組みで扱う。
 * 新しいドリルを作るときは、この形の定義を1つ作って registry.ts に追加する。
 */
export interface DrillDefinition<Q, A> {
  /** 記録に残すドリルの種類 */
  id: string
  /** 表示名 */
  title: string
  /** ドリルのページ */
  path: string
  /** 問題を保存できる形(JSON にできる値)にする */
  toData(question: Q): unknown
  /** 保存した形から問題を作り直す。形が正しくなければエラーを投げる */
  fromData(data: unknown): Q
  /** 同じ問題を見分けるキー */
  keyOf(question: Q): string
  judge(question: Q, answer: A): boolean
  renderQuestion(props: QuestionViewProps<Q, A>): ReactNode
  renderExplanation(result: DrillResult<Q, A>): ReactNode
  /** 一覧で問題を小さく見せる */
  renderPreview(question: Q): ReactNode
  /** 回答を短い文で表す(例: 「3萬切り」) */
  describeAnswer(question: Q, answer: A): string
  /** 正解を短い文で表す */
  describeCorrect(question: Q): string
}

/** いろいろな種類のドリル定義をまとめて扱うための型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDrillDefinition = DrillDefinition<any, any>

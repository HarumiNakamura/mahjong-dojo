import { useCallback } from 'react'
import { SITE_NAME } from '../config/site'
import { useRecords } from '../app/records/useRecords'
import { sharePath } from '../app/share'
import type { DrillResult } from '../components/drill/Drill'
import { addAttempt, isFavorite, toggleFavorite } from '../engine/records'
import type { DrillDefinition } from './types'

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** ドリルの回答を学習記録に残し、お気に入りの登録・解除をする */
export function useDrillRecorder<Q, A>(definition: DrillDefinition<Q, A>) {
  const { data, update } = useRecords()

  const onResult = useCallback(
    ({ question, answer, correct }: DrillResult<Q, A>) => {
      update((d) =>
        addAttempt(d, {
          id: newId(),
          drill: definition.id,
          questionKey: definition.keyOf(question),
          question: definition.toData(question),
          answer,
          correct,
          answeredAt: new Date().toISOString(),
        }),
      )
    },
    [definition, update],
  )

  const favorite = {
    isFavorite: (q: Q) => isFavorite(data, definition.id, definition.keyOf(q)),
    toggle: (q: Q) =>
      update((d) =>
        toggleFavorite(d, {
          drill: definition.id,
          questionKey: definition.keyOf(q),
          question: definition.toData(q),
          addedAt: new Date().toISOString(),
        }),
      ),
  }

  return { onResult, favorite, share: shareFor(definition) }
}

/** 問題を共有するためのパスと投稿文 */
export function shareFor<Q, A>(definition: DrillDefinition<Q, A>) {
  return {
    path: (q: Q) => sharePath(definition.id, definition.toData(q)),
    text: () => `${SITE_NAME}の「${definition.title}」の問題です。あなたならどうする?`,
  }
}

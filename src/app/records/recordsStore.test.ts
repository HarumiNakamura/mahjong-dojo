import { describe, expect, it } from 'vitest'
import { addAttempt, emptyRecords } from '../../engine/records'
import { createRecordsStore, detectStorage, RECORDS_STORAGE_KEY, type StorageLike } from './recordsStore'

function memoryStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

const attempt = {
  id: 'a1',
  drill: 'efficiency',
  questionKey: 'q',
  question: {},
  answer: 1,
  correct: true,
  answeredAt: '2026-10-18T00:00:00Z',
}

describe('detectStorage', () => {
  it('読み書きできれば使う', () => {
    const s = memoryStorage()
    expect(detectStorage(() => s)).toBe(s)
    expect(s.map.size).toBe(0)
  })

  it('取り出すだけでエラーになる環境(プライベートブラウズなど)では null', () => {
    expect(
      detectStorage(() => {
        throw new Error('SecurityError')
      }),
    ).toBeNull()
  })

  it('書き込みでエラーになる環境では null', () => {
    const s = memoryStorage()
    s.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(detectStorage(() => s)).toBeNull()
  })

  it('localStorage がない環境では null', () => {
    expect(detectStorage(() => undefined)).toBeNull()
  })
})

describe('createRecordsStore', () => {
  it('保存して、作り直しても読み出せる', () => {
    const s = memoryStorage()
    const store = createRecordsStore(s)
    store.update((d) => addAttempt(d, attempt))
    expect(JSON.parse(s.map.get(RECORDS_STORAGE_KEY)!).attempts).toHaveLength(1)
    expect(createRecordsStore(s).getSnapshot().data.attempts).toHaveLength(1)
  })

  it('保存先がなくても、メモリの中で記録できる(サイトは壊れない)', () => {
    const store = createRecordsStore(null)
    let calls = 0
    store.subscribe(() => calls++)
    store.update((d) => addAttempt(d, attempt))
    const snap = store.getSnapshot()
    expect(snap.persistent).toBe(false)
    expect(snap.data.attempts).toHaveLength(1)
    expect(calls).toBe(1)
  })

  it('保存に失敗したら saveFailed を立て、記録はメモリに残す', () => {
    const s = memoryStorage()
    const store = createRecordsStore(s)
    s.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    store.update((d) => addAttempt(d, attempt))
    expect(store.getSnapshot().saveFailed).toBe(true)
    expect(store.getSnapshot().data.attempts).toHaveLength(1)
  })

  it('保存データが壊れていたら空の記録から始める', () => {
    const s = memoryStorage()
    s.map.set(RECORDS_STORAGE_KEY, '{壊れたデータ')
    expect(createRecordsStore(s).getSnapshot().data).toEqual(emptyRecords())
  })

  it('読み出しでエラーになっても空の記録から始める', () => {
    const s = memoryStorage()
    s.getItem = () => {
      throw new Error('SecurityError')
    }
    expect(createRecordsStore(s).getSnapshot().data).toEqual(emptyRecords())
  })

  it('別のタブで書き換わったら読み直せる', () => {
    const s = memoryStorage()
    const store = createRecordsStore(s)
    s.map.set(RECORDS_STORAGE_KEY, JSON.stringify(addAttempt(emptyRecords(), attempt)))
    store.reload()
    expect(store.getSnapshot().data.attempts).toHaveLength(1)
  })
})

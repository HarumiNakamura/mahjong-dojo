/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { afterAll, describe, expect, it } from 'vitest'
import { SCORING_CASES, type ScoringCase } from './scoring.cases'
import { calculateScore, doraFromIndicator, LIMIT_LABELS, type ScoreResult, type ScoreFailure } from './scoring'
import { parseTiles } from './tiles'

function run(c: ScoringCase): ScoreResult | ScoreFailure {
  const { dora, ura, ...ctx } = c.ctx ?? {}
  return calculateScore({
    hand: parseTiles(c.hand),
    winTile: parseTiles(c.win)[0],
    melds: (c.melds ?? []).map(([type, tiles]) => ({ type, tiles: parseTiles(tiles) })),
    context: {
      tsumo: false,
      roundWind: 1,
      seatWind: 2,
      ...ctx,
      doraIndicators: dora ? parseTiles(dora) : [],
      uraDoraIndicators: ura ? parseTiles(ura) : [],
    },
  })
}

/** docs/scoring-tests.md に書き出すための結果 */
const report: { c: ScoringCase; result: ScoreResult | ScoreFailure; passed: boolean }[] = []

describe('役・符・点数の計算(docs/rules.md 準拠)', () => {
  for (const c of SCORING_CASES) {
    it(`${c.id} ${c.category}: ${c.title}`, () => {
      const result = run(c)
      let passed = false
      try {
        const e = c.expect
        if ('ok' in e) {
          expect(result.ok).toBe(false)
        } else {
          if (!result.ok) throw new Error(`アガれませんでした: ${result.reason}`)
          const names = result.yaku.map((y) => y.name)
          if (e.han !== undefined) expect(result.han).toBe(e.han)
          if (e.fu !== undefined) expect(result.fu).toBe(e.fu)
          if (e.limit !== undefined) expect(result.limit).toBe(e.limit)
          expect(result.points).toBe(e.points)
          if (e.ron !== undefined) expect(result.payment).toEqual({ type: 'ron', fromDiscarder: e.ron })
          if (e.tsumo !== undefined) {
            expect(result.payment).toEqual({ type: 'tsumo', fromDealer: e.tsumo[0], fromNonDealer: e.tsumo[1] })
          }
          if (e.total !== undefined) expect(result.total).toBe(e.total)
          for (const y of e.yaku ?? []) expect(names).toContain(y)
          for (const y of e.notYaku ?? []) expect(names).not.toContain(y)
          if (e.yakuman !== undefined) expect(result.yakuman.map((y) => y.name).sort()).toEqual([...e.yakuman].sort())
          for (const [label, fu] of e.fuItems ?? []) expect(result.fuItems).toContainEqual({ label, fu })
          if (e.dora !== undefined) expect(result.dora.map((d) => [d.name, d.han])).toEqual(e.dora)
        }
        passed = true
      } finally {
        report.push({ c, result, passed })
      }
    })
  }
})

describe('ドラ表示牌の巡回', () => {
  it('9→1、北→東、中→白、それ以外は次の牌', () => {
    expect(doraFromIndicator(8)).toBe(0) // 9m → 1m
    expect(doraFromIndicator(26)).toBe(18) // 9s → 1s
    expect(doraFromIndicator(4)).toBe(5) // 5m → 6m
    expect(doraFromIndicator(27)).toBe(28) // 東 → 南
    expect(doraFromIndicator(30)).toBe(27) // 北 → 東
    expect(doraFromIndicator(31)).toBe(32) // 白 → 發
    expect(doraFromIndicator(33)).toBe(31) // 中 → 白
  })
})

// ---- 結果の書き出し(SCORING_REPORT=1 のときだけ) ----

function describeResult(r: ScoreResult | ScoreFailure): string {
  if (!r.ok) return `アガリ不可(${r.reason})`
  const pay =
    r.payment.type === 'ron'
      ? `ロン ${r.payment.fromDiscarder.toLocaleString()}点`
      : r.payment.fromDealer === null
        ? `${r.payment.fromNonDealer.toLocaleString()}オール`
        : `${r.payment.fromNonDealer.toLocaleString()}/${r.payment.fromDealer.toLocaleString()}`
  const yaku = r.yakuman.length
    ? r.yakuman.map((y) => y.name).join('・')
    : [...r.yaku.map((y) => `${y.name}${y.han}`), ...r.dora.map((d) => `${d.name}${d.han}`)].join('・')
  const extra = r.total !== r.points ? `(本場・供託込み ${r.total.toLocaleString()}点)` : ''
  return `${r.label} / ${pay}${extra} / ${yaku}`
}

function describeInput(c: ScoringCase): string {
  const parts = [`手牌 ${c.hand}`, `アガリ ${c.win}`]
  if (c.melds?.length) parts.push(`副露 ${c.melds.map(([t, tiles]) => `${t}:${tiles}`).join(' ')}`)
  const ctx = c.ctx ?? {}
  const flags = [
    ctx.seatWind === 1 ? '親' : '子',
    ctx.tsumo ? 'ツモ' : 'ロン',
    ctx.riichi && 'リーチ',
    ctx.doubleRiichi && 'ダブル立直',
    ctx.ippatsu && '一発',
    ctx.rinshan && '嶺上',
    ctx.chankan && '搶槓',
    ctx.haitei && '海底',
    ctx.houtei && '河底',
    ctx.tenhou && '天和',
    ctx.chiihou && '地和',
    ctx.dora && `ドラ表示 ${ctx.dora}`,
    ctx.ura && `裏ドラ表示 ${ctx.ura}`,
    ctx.honba && `${ctx.honba}本場`,
    ctx.riichiSticks && `供託${ctx.riichiSticks}本`,
  ].filter(Boolean)
  return `${parts.join(' / ')} / ${flags.join('・')}`
}

afterAll(() => {
  if (!process.env.SCORING_REPORT) return
  const passed = report.filter((r) => r.passed).length
  const lines = [
    '# 点数計算のテスト一覧',
    '',
    'このファイルは `npm run report:scoring` で自動生成しています(直接編集しないでください)。',
    'テストケースは `src/engine/scoring.cases.ts`、計算は `src/engine/scoring.ts` にあります。',
    '特に書かない限り、東場・南家(子)・ロン・ドラなしです。牌の表記は `123m456p789s1122z`(赤5は0)。',
    '',
    `結果: ${report.length}件中 ${passed}件 成功`,
    '',
  ]
  let category = ''
  for (const { c, result, passed: ok } of report) {
    if (c.category !== category) {
      category = c.category
      lines.push(`## ${category}`, '', '| ID | 内容 | 入力 | 計算結果 | 判定 |', '| --- | --- | --- | --- | --- |')
    }
    lines.push(`| ${c.id} | ${c.title} | ${describeInput(c)} | ${describeResult(result)} | ${ok ? '成功' : '**失敗**'} |`)
    const next = report[report.findIndex((r) => r.c === c) + 1]
    if (!next || next.c.category !== category) lines.push('')
  }
  lines.push('## 区分の名前', '', Object.values(LIMIT_LABELS).join('・'), '')
  writeFileSync(new URL('../../docs/scoring-tests.md', import.meta.url), lines.join('\n'))
})

describe('ランダムなアガリ形', () => {
  it('リーチしていれば必ずアガれ、点数が正しい範囲に入る', async () => {
    const { createRng, randomInt } = await import('./random')
    const rng = createRng(77)
    let checked = 0
    while (checked < 300) {
      // 面子4つと雀頭を組み合わせてアガリ形を作る
      const counts = new Array(34).fill(0)
      counts[randomInt(rng, 34)] += 2
      for (let m = 0; m < 4; m++) {
        const k = randomInt(rng, 34)
        if (k < 27 && k % 9 <= 6 && rng() < 0.6) {
          counts[k]++
          counts[k + 1]++
          counts[k + 2]++
        } else {
          counts[k] += 3
        }
      }
      if (counts.some((n) => n > 4)) continue
      const hand = counts.flatMap((n, kind) => Array.from({ length: n }, () => ({ kind, red: false })))
      const winTile = hand[randomInt(rng, hand.length)]
      const tsumo = rng() < 0.5
      const r = calculateScore({ hand, winTile, context: { tsumo, roundWind: 1, seatWind: 1 + randomInt(rng, 4), riichi: true } })
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.points % 100).toBe(0)
        expect(r.points).toBeGreaterThanOrEqual(1000)
        if (r.yakuman.length === 0) expect(r.han).toBeGreaterThanOrEqual(1)
        expect(r.total).toBe(r.points)
      }
      checked++
    }
  })
})

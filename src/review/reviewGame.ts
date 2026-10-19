// CPU対戦の振り返り: 半荘の牌譜から、自分の判断の気になるところ(指摘)を探す
//
// 牌譜を1手ずつ再現し、自分の打牌・鳴き・アガリの場面で、分類ごとの判定(checks.ts)を行う。
// 判定はその場面で見えていた情報だけを使う。結果は統計をもとにした目安(docs/review.md)。

import Majiang, { type Paipu } from '@kobalab/majiang-core'
import { checkCall, checkDefense, checkDiscard, checkMissedCall, checkMissedRon, checkMissedTsumo, checkYakulessDama, judgeScene } from './checks'
import { hulepai, type Scene } from './scene'
import { REVIEW_THRESHOLDS as T } from './thresholds'
import { CATEGORIES, type Finding, type FindingCategory, type GameReview } from './types'

type LogEvent = Record<string, Record<string, unknown> | undefined>

/** 1局分を調べて、指摘を out に足す。調べた打牌の数を返す */
function reviewKyoku(paipu: Paipu, kyoku: number, playerId: number, out: Finding[]): number {
  const events = paipu.log[kyoku] as LogEvent[]
  const board = new Majiang.Board({ title: paipu.title, player: paipu.player, qijia: paipu.qijia })
  board.qipai(events[0].qipai)
  const scene: Scene = { board, me: board.menfeng(playerId), turn: 0, orders: [[], [], [], []] }
  const me = scene.me
  // ロンできるか(フリテンでないか)。majiang-core の Player と同じ決め方
  let nengRong = true
  let riichiChecked = false
  let decisions = 0
  const add = (f: Finding | null) => {
    if (f) out.push({ ...f, loss: Math.round(f.loss / 10) * 10 })
  }

  for (let i = 1; i < events.length; i++) {
    const e = events[i]
    const next = events[i + 1]
    // 判断した場面は、この手の直前の盤面(牌譜の手数 i − 1)
    const before = { kyoku, step: i - 1 }

    if (e.dapai && e.dapai.l === me) {
      const pai = e.dapai.p as string
      const shoupai = board.shoupai[me]
      if (!shoupai.lizhi) {
        decisions++
        const j = judgeScene(scene)
        if (j) {
          const paid = next?.hule && next.hule.baojia === me ? -(next.hule.fenpei as number[])[me] : 0
          const toRiichi = next?.hule ? board.shoupai[next.hule.l as number].lizhi : false
          const defense = checkDefense(scene, before, pai, j, { paid, toRiichi })
          if (defense) add(defense)
          // リーチを受けているときは守備の判定だけ(牌効率は問わない)
          else if (board.shoupai.every((s, l) => l === me || !s.lizhi)) add(checkDiscard(scene, before, pai, j))
        }
        if (!riichiChecked) {
          const r = checkYakulessDama(scene, before, pai)
          if (r) {
            riichiChecked = true
            add(r)
          }
        }
        nengRong = true
      }
    }
    if (e.fulou && e.fulou.l === me) add(checkCall(scene, before, e.fulou.m as string, board.lunban))

    // 盤面を1手進める
    if (e.zimo) board.zimo(e.zimo)
    else if (e.gangzimo) board.zimo(e.gangzimo)
    else if (e.dapai) board.dapai(e.dapai)
    else if (e.fulou) board.fulou(e.fulou)
    else if (e.gang) board.gang(e.gang)
    else if (e.kaigang) board.kaigang(e.kaigang)
    else if (e.hule) board.hule(e.hule)
    else if (e.pingju) board.pingju(e.pingju)
    if (e.dapai) scene.orders[e.dapai.l as number].push(i)

    const at = { kyoku, step: i }
    const zimo = e.zimo ?? e.gangzimo
    if (zimo && zimo.l === me) {
      scene.turn++
      const declared = next?.hule && next.hule.l === me
      if (!declared) add(checkMissedTsumo(scene, at, Boolean(e.gangzimo)))
    }
    if (e.dapai) {
      const l = e.dapai.l as number
      const pai = e.dapai.p as string
      if (l === me) {
        if (hulepai(board.shoupai[me]).some((p) => board.he[me].find(p))) nengRong = false
      } else {
        // 次の手: 自分のロン → 指摘なし、ほかの人のロン(頭ハネ) → ロンできなかったので指摘なし
        if (!next?.hule) add(checkMissedRon(scene, at, pai, l, nengRong))
        // 鳴ける牌をスルーした(次の手が自分以外の鳴きなら、優先順位で鳴けなかった)
        if (next && (next.zimo || next.gangzimo)) add(checkMissedCall(scene, at, pai, l))
        const s = pai[0]
        const n = Number(pai[1]) || 5
        if (hulepai(board.shoupai[me]).some((p) => p === `${s}${n}`)) nengRong = false
      }
    }
  }
  return decisions
}

/** 半荘の振り返り(playerId はプレイヤーの番号。CPU対戦の自分は 0) */
export function reviewGame(paipu: Paipu, playerId = 0): GameReview {
  const findings: Finding[] = []
  let decisions = 0
  for (let k = 0; k < paipu.log.length; k++) decisions += reviewKyoku(paipu, k, playerId, findings)
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<FindingCategory, number>
  for (const f of findings) counts[f.category]++
  const turningPoints = [...findings]
    .filter((f) => f.loss >= T.turningPointMinLoss)
    .sort((a, b) => b.loss - a.loss || a.kyoku - b.kyoku || a.step - b.step)
    .slice(0, T.turningPoints)
  return {
    findings,
    counts,
    totalLoss: findings.reduce((a, f) => a + f.loss, 0),
    turningPoints,
    decisions,
  }
}

// 牌譜の再生: 半荘の牌譜から、指定した局・手数の盤面を作る
//
// 局面は「局の番号(0から)」と「手数(0 = 配牌、1 = 最初のツモ …)」で表す。
// 盤面は majiang-core の Board に、局の始まりから1手ずつ当てはめて作る。

import Majiang, { type Board, type Paipu } from '@kobalab/majiang-core'
import { tileName } from '../engine/tiles'
import { fromPai } from './convert'

type LogEvent = Record<string, Record<string, unknown> | undefined>

const WINDS = ['東', '南', '西', '北']

/** 局面の位置 */
export interface ReplayScene {
  kyoku: number
  step: number
}

const eventsOf = (paipu: Paipu, kyoku: number) => (paipu.log[kyoku] ?? []) as LogEvent[]

/** 局の数 */
export const kyokuCount = (paipu: Paipu) => paipu.log.length

/** その局の最後の手数 */
export const lastStep = (paipu: Paipu, kyoku: number) => Math.max(0, eventsOf(paipu, kyoku).length - 1)

/** 範囲の外の位置を、いちばん近い正しい位置にする */
export function clampScene(paipu: Paipu, scene: ReplayScene): ReplayScene {
  const kyoku = Math.min(Math.max(0, Math.trunc(scene.kyoku) || 0), Math.max(0, kyokuCount(paipu) - 1))
  const step = Math.min(Math.max(0, Math.trunc(scene.step) || 0), lastStep(paipu, kyoku))
  return { kyoku, step }
}

/** 「東1局 0本場」 */
export function kyokuLabel(paipu: Paipu, kyoku: number): string {
  const q = eventsOf(paipu, kyoku)[0]?.qipai as { zhuangfeng: number; jushu: number; changbang: number } | undefined
  if (!q) return ''
  return `${WINDS[q.zhuangfeng]}${q.jushu + 1}局 ${q.changbang}本場`
}

/** その局の結果(「CPU 1 のロン 3,900点」「流局」) */
export function kyokuResult(paipu: Paipu, kyoku: number): string {
  const q = eventsOf(paipu, kyoku)[0]?.qipai as { jushu: number } | undefined
  const nameOf = (l: number) => paipu.player[(paipu.qijia + (q?.jushu ?? 0) + l) % 4]
  const parts: string[] = []
  for (const e of eventsOf(paipu, kyoku)) {
    if (e.hule) parts.push(`${nameOf(e.hule.l as number)}の${e.hule.baojia == null ? 'ツモ' : 'ロン'} ${(e.hule.defen as number).toLocaleString('ja-JP')}点`)
    if (e.pingju) parts.push('流局')
  }
  return parts.join('・')
}

/** 局面の盤面を作る */
export function boardAt(paipu: Paipu, scene: ReplayScene): Board {
  const { kyoku, step } = clampScene(paipu, scene)
  const board = new Majiang.Board({ title: paipu.title, player: paipu.player, qijia: paipu.qijia })
  const events = eventsOf(paipu, kyoku)
  for (let i = 0; i <= step && i < events.length; i++) {
    const e = events[i]
    if (e.qipai) board.qipai(e.qipai)
    else if (e.zimo) board.zimo(e.zimo)
    else if (e.gangzimo) board.zimo(e.gangzimo)
    else if (e.dapai) board.dapai(e.dapai)
    else if (e.fulou) board.fulou(e.fulou)
    else if (e.gang) board.gang(e.gang)
    else if (e.kaigang) board.kaigang(e.kaigang)
    else if (e.hule) board.hule(e.hule)
    else if (e.pingju) board.pingju(e.pingju)
  }
  return board
}

/** その局で自分(プレイヤー 0)の座席 */
export function mySeat(paipu: Paipu, kyoku: number): number {
  const q = eventsOf(paipu, kyoku)[0]?.qipai as { jushu: number } | undefined
  return (8 - paipu.qijia - (q?.jushu ?? 0)) % 4
}

/** 手番の座席(配牌・流局・ドラ追加は null) */
export function actorOf(paipu: Paipu, scene: ReplayScene): number | null {
  const e = eventsOf(paipu, scene.kyoku)[scene.step]
  const body = e && (e.zimo ?? e.gangzimo ?? e.dapai ?? e.fulou ?? e.gang ?? e.hule)
  return body ? (body.l as number) : null
}

/** 自分が打牌した手数(「次の自分の番」へ進むため) */
export function myDiscardSteps(paipu: Paipu, kyoku: number): number[] {
  const me = mySeat(paipu, kyoku)
  return eventsOf(paipu, kyoku).flatMap((e, i) => (e.dapai && e.dapai.l === me ? [i] : []))
}

const paiName = (p: string) => tileName(fromPai(p.slice(0, 2)))

function meldName(m: string): string {
  const digits = m.match(/\d/g) ?? []
  if (digits.length === 4) return /[+=-]$/.test(m) ? '大明槓' : /[+=-]/.test(m) ? '加槓' : '暗槓'
  const plain = digits.map((d) => (d === '0' ? '5' : d))
  return plain.every((d) => d === plain[0]) ? 'ポン' : 'チー'
}

/**
 * その手の説明(「CPU 1 が 5萬 を切った(リーチ)」など)。
 * showAll が false のときは、他家のツモ牌を伏せる。
 */
export function describeStep(paipu: Paipu, scene: ReplayScene, showAll: boolean): string {
  const e = eventsOf(paipu, scene.kyoku)[scene.step]
  if (!e) return ''
  const q = eventsOf(paipu, scene.kyoku)[0]?.qipai as { jushu: number }
  const nameOf = (l: number) => paipu.player[(paipu.qijia + q.jushu + l) % 4]
  const me = mySeat(paipu, scene.kyoku)
  if (e.qipai) return `${kyokuLabel(paipu, scene.kyoku)} 配牌`
  const zimo = e.zimo ?? e.gangzimo
  if (zimo) {
    const l = zimo.l as number
    const what = showAll || l === me ? `${paiName(zimo.p as string)}を` : ''
    return `${nameOf(l)}が${what}${e.gangzimo ? '嶺上牌で' : ''}ツモ`
  }
  if (e.dapai) {
    const p = e.dapai.p as string
    const notes = [p.endsWith('*') ? 'リーチ' : '', p.includes('_') ? 'ツモ切り' : ''].filter(Boolean)
    return `${nameOf(e.dapai.l as number)}が${paiName(p)}を切った${notes.length ? `(${notes.join('・')})` : ''}`
  }
  if (e.fulou) return `${nameOf(e.fulou.l as number)}が${meldName(e.fulou.m as string)}`
  if (e.gang) return `${nameOf(e.gang.l as number)}が${meldName(e.gang.m as string)}`
  if (e.kaigang) return `カンドラ表示牌 ${paiName(e.kaigang.baopai as string)}`
  if (e.hule) {
    const h = e.hule
    const how = h.baojia == null ? 'ツモ' : `ロン(${nameOf(h.baojia as number)}から)`
    return `${nameOf(h.l as number)}の${how} ${(h.defen as number).toLocaleString('ja-JP')}点`
  }
  if (e.pingju) return '流局'
  return ''
}

/** 牌譜の場面の URL */
export function replayUrl(id: string, scene?: ReplayScene, showAll = false): string {
  const q = new URLSearchParams({ g: id })
  if (scene) {
    q.set('k', String(scene.kyoku))
    q.set('s', String(scene.step))
  }
  if (showAll) q.set('v', 'all')
  return `/play/replay?${q.toString()}`
}

/** 振り返りの URL */
export const reviewUrl = (id: string) => `/play/review?g=${encodeURIComponent(id)}`

// CPU対戦の「自分」のプレイヤー
//
// majiang-core の Game から届く知らせ(ツモ・他家の打牌・鳴き など)に対して、
// できる操作(打牌・リーチ・ツモ・カン・ロン・チー・ポン)を計算し、画面からの操作を待つ。
// 何もできない場面(鳴けない打牌など)は待たずに先へ進める。

import Majiang from '@kobalab/majiang-core'

/** 画面に出す「いまできる操作」 */
export type HumanRequest =
  | {
      kind: 'zimo'
      /** 切れる牌(喰い替えになる牌は含まない) */
      dapai: string[]
      /** リーチできる打牌(なければ空) */
      lizhi: string[]
      /** ツモアガリできる */
      hule: boolean
      /** 暗槓・加槓の候補 */
      gang: string[]
      /** リーチ中(ツモ切りか、アガリ・暗槓だけ) */
      inLizhi: boolean
    }
  | {
      kind: 'dapai'
      /** 他家の捨て牌(向きの印つき。例: 'm3-') */
      pai: string
      hule: boolean
      chi: string[]
      peng: string[]
      gang: string[]
    }
  | { kind: 'fulou'; dapai: string[] }
  | { kind: 'qianggang'; pai: string }
  | { kind: 'hule'; hule: Record<string, unknown> }
  | { kind: 'pingju'; pingju: Record<string, unknown> }
  | { kind: 'jieju'; paipu: Record<string, unknown> }

export type HumanReply =
  | { dapai: string }
  | { hule: '-' }
  | { gang: string }
  | { fulou: string }
  | Record<string, never>

type Listener = () => void

export class HumanPlayer extends Majiang.Player {
  /** いま画面に出している操作(なければ null) */
  request: HumanRequest | null = null
  /** 画面の再描画のために、変化があるたびに増える */
  version = 0
  /** 局の中で、各座席の河の牌が何手目に切られたか(練習モードの危険度のヒントに使う) */
  orders: number[][] = [[], [], [], []]
  private dapaiCount = 0
  private listeners = new Set<Listener>()
  private respond: ((reply?: unknown) => void) | null = null

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  /** 盤面が変わったことを画面に知らせる */
  notify() {
    this.version++
    for (const fn of this.listeners) fn()
  }

  /** 画面からの操作を Game に返す */
  reply(reply: HumanReply) {
    const respond = this.respond
    this.request = null
    this.respond = null
    this.notify()
    respond?.(Object.keys(reply).length ? reply : undefined)
  }

  private ask(request: HumanRequest) {
    this.request = request
    this.respond = (r) => (this as unknown as { _callback: (r?: unknown) => void })._callback(r)
    this.notify()
  }

  private pass() {
    this.notify()
    ;(this as unknown as { _callback: (r?: unknown) => void })._callback()
  }

  // ---- majiang-core から呼ばれる ----

  action_kaiju() {
    this.pass()
  }

  action_qipai() {
    this.orders = [[], [], [], []]
    this.dapaiCount = 0
    this.pass()
  }

  action_zimo(zimo: { l: number }, gangzimo: boolean) {
    if (zimo.l !== this._menfeng) return this.pass()
    const shoupai = this.shoupai
    const inLizhi = shoupai.lizhi
    const lizhi = inLizhi ? false : this.allow_lizhi(shoupai)
    this.ask({
      kind: 'zimo',
      dapai: this.get_dapai(shoupai) ?? [],
      lizhi: Array.isArray(lizhi) ? lizhi : [],
      hule: this.allow_hule(shoupai, null, gangzimo),
      gang: this.get_gang_mianzi(shoupai) ?? [],
      inLizhi,
    })
  }

  action_dapai(dapai: { l: number; p: string }) {
    this.orders[dapai.l].push(++this.dapaiCount)
    if (dapai.l === this._menfeng) return this.pass()
    const d = ['', '+', '=', '-'][(4 + this._model.lunban - this._menfeng) % 4]
    const p = dapai.p.slice(0, 2) + d
    const shoupai = this.shoupai
    const hule = this.allow_hule(shoupai, p)
    const lizhi = shoupai.lizhi
    const chi = lizhi ? [] : (this.get_chi_mianzi(shoupai, p) ?? [])
    const peng = lizhi ? [] : (this.get_peng_mianzi(shoupai, p) ?? [])
    const gang = lizhi ? [] : (this.get_gang_mianzi(shoupai, p) ?? [])
    if (!hule && !chi.length && !peng.length && !gang.length) return this.pass()
    this.ask({ kind: 'dapai', pai: p, hule, chi, peng, gang })
  }

  action_fulou(fulou: { l: number; m: string }) {
    // 自分のチー・ポンのあとは打牌する(大明槓はこのあと嶺上牌をツモる)
    if (fulou.l !== this._menfeng || /^[mpsz]\d{4}/.test(fulou.m)) return this.pass()
    this.ask({ kind: 'fulou', dapai: this.get_dapai(this.shoupai) ?? [] })
  }

  action_gang(gang: { l: number; m: string }) {
    // 他家の加槓には搶槓できる(暗槓には搶槓できない)
    if (gang.l === this._menfeng || /^[mpsz]\d{4}$/.test(gang.m)) return this.pass()
    const d = ['', '+', '=', '-'][(4 + this._model.lunban - this._menfeng) % 4]
    const p = gang.m[0] + gang.m.slice(-1) + d
    if (!this.allow_hule(this.shoupai, p, true)) return this.pass()
    this.ask({ kind: 'qianggang', pai: p })
  }

  action_hule(hule: Record<string, unknown>) {
    this.ask({ kind: 'hule', hule })
  }

  action_pingju(pingju: Record<string, unknown>) {
    this.ask({ kind: 'pingju', pingju })
  }

  action_jieju(paipu: Record<string, unknown>) {
    this.ask({ kind: 'jieju', paipu })
  }
}

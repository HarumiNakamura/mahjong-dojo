// CPU対戦「やさしい」の CPU
//
// 受け入れ枚数が一番多い牌を切る(何切るドリルと同じ判定)。守備はしない(リーチを受けても押す)。
// 鳴かない。テンパイしたらリーチし、アガれるときはアガる。

import Majiang from '@kobalab/majiang-core'
import { judgeDiscards } from '../engine/efficiency'
import { handView, toPai } from './convert'

type Callback = (reply?: unknown) => void

export class EasyPlayer extends Majiang.Player {
  private get reply(): Callback {
    return (this as unknown as { _callback: Callback })._callback
  }

  /** 切る牌(majiang-core の表記)。手牌の受け入れ枚数が一番多い打牌 */
  chooseDapai(): string {
    const shoupai = this.shoupai
    const options = this.get_dapai(shoupai) ?? []
    if (shoupai.lizhi) return options[options.length - 1]
    const v = handView(shoupai.toString())
    const tiles = v.drawn ? [...v.tiles, v.drawn] : v.tiles
    try {
      const best = judgeDiscards(tiles).best.tile
      const p = toPai(best)
      const drawn = v.drawn && v.drawn.kind === best.kind && v.drawn.red === best.red
      if (drawn && options.includes(`${p}_`)) return `${p}_`
      if (options.includes(p)) return p
    } catch {
      // 判定できなければツモ切り
    }
    return options[options.length - 1]
  }

  action_kaiju() {
    this.reply()
  }

  action_qipai() {
    this.reply()
  }

  action_zimo(zimo: { l: number }, gangzimo: boolean) {
    if (zimo.l !== this._menfeng) return this.reply()
    const shoupai = this.shoupai
    if (this.allow_hule(shoupai, null, gangzimo)) return this.reply({ hule: '-' })
    const p = this.chooseDapai()
    const lizhi = !shoupai.lizhi && this.allow_lizhi(shoupai, p.slice(0, 2))
    this.reply({ dapai: lizhi ? `${p}*` : p })
  }

  action_dapai(dapai: { l: number; p: string }) {
    if (dapai.l === this._menfeng) return this.reply()
    const d = ['', '+', '=', '-'][(4 + this._model.lunban - this._menfeng) % 4]
    if (this.allow_hule(this.shoupai, dapai.p.slice(0, 2) + d)) return this.reply({ hule: '-' })
    this.reply()
  }

  action_fulou() {
    this.reply()
  }

  action_gang(gang: { l: number; m: string }) {
    if (gang.l === this._menfeng || /^[mpsz]\d{4}$/.test(gang.m)) return this.reply()
    const d = ['', '+', '=', '-'][(4 + this._model.lunban - this._menfeng) % 4]
    if (this.allow_hule(this.shoupai, gang.m[0] + gang.m.slice(-1) + d, true)) return this.reply({ hule: '-' })
    this.reply()
  }

  action_hule() {
    this.reply()
  }

  action_pingju() {
    this.reply()
  }

  action_jieju() {
    this.reply()
  }
}

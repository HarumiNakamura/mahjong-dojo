// 振り返りのテスト用に、短い牌譜を手で作る
//
// 自分(プレイヤー 0)は起家の親(座席 0)。他家の配牌は伏せたまま(ツモ・打牌だけを書く)。

import type { Paipu } from '@kobalab/majiang-core'

type Event = Record<string, Record<string, unknown>>

export interface KyokuSpec {
  /** 自分の配牌(13枚) */
  hand: string
  /** ドラ表示牌 */
  baopai?: string
  events: Event[]
}

export const zimo = (l: number, p: string): Event => ({ zimo: { l, p } })
export const dapai = (l: number, p: string): Event => ({ dapai: { l, p } })
export const fulou = (l: number, m: string): Event => ({ fulou: { l, m } })
export const pingju = (): Event => ({ pingju: { name: '荒牌平局', shoupai: ['', '', '', ''], fenpei: [0, 0, 0, 0] } })
export const ron = (l: number, baojia: number, defen: number, shoupai = 'm123456789p1123s4'): Event => {
  const fenpei = [0, 0, 0, 0]
  fenpei[l] = defen
  fenpei[baojia] = -defen
  return { hule: { l, shoupai, baojia, fubaopai: null, defen, hupai: [{ name: '立直', fanshu: 1 }], fenpei } }
}

/** 他家3人が順に1枚ずつツモ切りする(自分の打牌のあと) */
export function othersPass(tiles: [string, string, string]): Event[] {
  return tiles.flatMap((p, i) => [zimo(i + 1, p), dapai(i + 1, `${p}_`)])
}

export function makePaipu(kyokus: KyokuSpec[]): Paipu {
  return {
    title: 'テスト',
    player: ['あなた', 'CPU 1', 'CPU 2', 'CPU 3'],
    qijia: 0,
    log: kyokus.map((k) => [
      {
        qipai: {
          zhuangfeng: 0,
          jushu: 0,
          changbang: 0,
          lizhibang: 0,
          defen: [25000, 25000, 25000, 25000],
          baopai: k.baopai ?? 's7',
          shoupai: [k.hand, '', '', ''],
        },
      },
      ...k.events,
    ]),
    defen: [25000, 25000, 25000, 25000],
    rank: [1, 2, 3, 4],
    point: ['0', '0', '0', '0'],
  }
}

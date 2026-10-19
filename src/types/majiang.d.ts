// @kobalab/majiang-core・@kobalab/majiang-ai(MIT)の型定義(このサイトで使う部分だけ)
// ライブラリは型定義を同梱していないので、ここで最低限を書く。

declare module '@kobalab/majiang-core' {
  /** 牌の表記: 'm1'〜'm9'(m0 は赤5)・'p'・'s'・'z1'〜'z7' */
  export type Pai = string

  export type Rule = Record<string, unknown>

  export class Shoupai {
    static fromString(paistr?: string): Shoupai
    static valid_pai(p: string): string | undefined
    static valid_mianzi(m: string): string | undefined
    constructor(qipai?: Pai[])
    _bingpai: Record<'m' | 'p' | 's' | 'z', number[]> & { _: number }
    _fulou: string[]
    _zimo: string | null
    _lizhi: boolean
    get lizhi(): boolean
    get menqian(): boolean
    clone(): Shoupai
    toString(): string
    zimo(p: Pai, check?: boolean): Shoupai
    dapai(p: Pai, check?: boolean): Shoupai
    fulou(m: string, check?: boolean): Shoupai
    gang(m: string, check?: boolean): Shoupai
    get_dapai(check?: boolean): Pai[] | null
    get_chi_mianzi(p: string, check?: boolean): string[] | null
    get_peng_mianzi(p: string): string[] | null
    get_gang_mianzi(p?: string): string[] | null
  }

  export class Shan {
    constructor(rule: Rule)
    _pai: Pai[]
    get paishu(): number
    get baopai(): Pai[]
    get fubaopai(): Pai[] | null
  }

  export class He {
    _pai: string[]
  }

  export interface HuleParam {
    rule: Rule
    zhuangfeng: number
    menfeng: number
    hupai: { lizhi: number; yifa: boolean; qianggang: boolean; lingshang: boolean; haidi: number; tianhu: number }
    baopai: Pai[]
    fubaopai: Pai[] | null
    jicun: { changbang: number; lizhibang: number }
  }

  export interface HuleResult {
    hupai: { name: string; fanshu: number | string; baojia?: string }[]
    fu?: number
    fanshu?: number
    damanguan?: number
    defen: number
    fenpei: number[]
  }

  export interface Paipu {
    title: string
    player: string[]
    qijia: number
    log: Record<string, unknown>[][]
    defen: number[]
    rank: number[]
    point: string[]
  }

  export interface GameModel {
    title: string
    player: string[]
    qijia: number
    zhuangfeng: number
    jushu: number
    changbang: number
    lizhibang: number
    defen: number[]
    shan: Shan
    shoupai: Shoupai[]
    he: He[]
    player_id: number[]
    lunban: number
  }

  export class Game {
    constructor(players: Player[], callback?: (paipu: Paipu) => void, rule?: Rule, title?: string)
    get model(): GameModel
    _model: GameModel
    _rule: Rule
    _paipu: Paipu
    _players: Player[]
    _sync: boolean
    _handler?: () => void
    _view?: { update(p?: unknown): void; summary(p: Paipu): void }
    _wait: number
    set handler(callback: () => void)
    set view(view: unknown)
    set speed(speed: number)
    get speed(): number
    kaiju(qijia?: number): void
    qipai(shan?: unknown): void
    do_sync(): this
    stop(callback?: () => void): void
    start(): void
    jieju(): void
    call_players(type: string, msg: unknown[], timeout?: number): void
    static allow_lizhi(rule: Rule, shoupai: Shoupai, p?: Pai, paishu?: number, defen?: number): boolean | Pai[]
    static allow_hule(rule: Rule, shoupai: Shoupai, p: Pai | null, zhuangfeng: number, menfeng: number, hupai: boolean, neng_rong: boolean): boolean
    static get_dapai(rule: Rule, shoupai: Shoupai): Pai[]
    static get_chi_mianzi(rule: Rule, shoupai: Shoupai, p: string, paishu: number): string[]
    static get_peng_mianzi(rule: Rule, shoupai: Shoupai, p: string, paishu: number): string[]
    static get_gang_mianzi(rule: Rule, shoupai: Shoupai, p: string | null, paishu: number, n_gang?: number): string[]
  }

  /** プレイヤーから見た局面(自分以外の手牌は '_') */
  export interface BoardModel {
    title: string
    player: string[]
    qijia: number
    zhuangfeng: number
    jushu: number
    changbang: number
    lizhibang: number
    defen: number[]
    shan: { paishu: number; baopai: Pai[]; fubaopai?: Pai[] | null }
    shoupai: Shoupai[]
    he: He[]
    player_id: number[]
    lunban: number
  }

  /** 牌譜を1手ずつ再現する盤面 */
  export interface Board extends BoardModel {
    menfeng(id: number): number
    qipai(qipai: unknown): void
    zimo(zimo: unknown): void
    dapai(dapai: unknown): void
    fulou(fulou: unknown): void
    gang(gang: unknown): void
    kaigang(kaigang: unknown): void
    hule(hule: unknown): void
    pingju(pingju: unknown): void
    last(): void
  }

  export class Player {
    constructor()
    action(msg: Record<string, unknown>, callback?: (reply?: unknown) => void): void
    _model: BoardModel
    _rule: Rule
    _id: number
    _menfeng: number
    _neng_rong: boolean
    get shoupai(): Shoupai
    get he(): He
    get model(): BoardModel
    set view(view: unknown)
    get_dapai(shoupai: Shoupai): Pai[] | null
    get_chi_mianzi(shoupai: Shoupai, p: string): string[] | null
    get_peng_mianzi(shoupai: Shoupai, p: string): string[] | null
    get_gang_mianzi(shoupai: Shoupai, p?: string): string[] | null
    allow_lizhi(shoupai: Shoupai, p?: Pai): boolean | Pai[]
    allow_hule(shoupai: Shoupai, p: string | null, hupai?: boolean): boolean
  }

  const Majiang: {
    rule(param?: Record<string, unknown>): Rule
    Shoupai: typeof Shoupai
    Shan: typeof Shan
    He: typeof He
    Game: typeof Game
    Player: typeof Player
    Board: new (kaiju?: { title: string; player: string[]; qijia: number }) => Board
    Util: {
      xiangting(shoupai: Shoupai): number
      tingpai(shoupai: Shoupai): Pai[] | null
      hule(shoupai: Shoupai, rongpai: string | null, param: HuleParam): HuleResult | undefined
      hule_param(param?: Record<string, unknown>): HuleParam
    }
  }
  export default Majiang
}

declare module '@kobalab/majiang-ai' {
  import type { Player } from '@kobalab/majiang-core'
  const AI: new () => Player
  export default AI
}

declare module '@kobalab/majiang-ai/legacy' {
  import type { Player } from '@kobalab/majiang-core'
  const legacy: (version: string) => new () => Player
  export default legacy
}

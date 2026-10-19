// CPU対戦の1半荘(自分1人 + CPU 3人)を進める
//
// 自分は座席(プレイヤー番号)0。CPU は majiang-ai。
// 進行は majiang-core の Game が非同期に行い、自分の番では HumanPlayer が画面の操作を待つ。

import AI from '@kobalab/majiang-ai'
import type { Paipu, Player } from '@kobalab/majiang-core'
import { HumanPlayer } from './humanPlayer'
import type { FinalResult } from './result'
import { MLEAGUE_RULE } from './rule'
import { MleagueGame, type GameSave } from './selfplay'

/** CPU の手番の速さ(1 = 速い 〜 5 = ゆっくり) */
export type GameSpeed = 1 | 2 | 3 | 4 | 5

export const PLAYER_NAMES = ['あなた', 'CPU 1', 'CPU 2', 'CPU 3']

export interface GameSession {
  game: MleagueGame
  human: HumanPlayer
  /** 声(ポン・チー・リーチ・ロン・ツモ)。座席(その局の l)と言葉。1.5秒で消える */
  lastSay: { l: number; name: string } | null
  setSpeed(speed: GameSpeed): void
  /** 練習モード(受け入れ枚数・危険度のヒントを出す) */
  practice: boolean
  /** CPU の難易度(表示用) */
  cpu: string
  /** 終わったら呼ばれる */
  onEnd?: (paipu: Paipu) => void
}

export interface SessionOptions {
  speed: GameSpeed
  makeCpu?: () => Player
  /** 途中保存から続ける */
  resume?: GameSave | null
  /** 局が始まる直前に呼ばれる(途中保存に使う) */
  onKyokuStart?: (save: GameSave) => void
  /** 半荘が終わった直前(結果を出す前)に呼ばれる */
  onGameEnd?: (paipu: Paipu, final: FinalResult) => void
  practice?: boolean
  /** CPU の難易度(表示用。CPU そのものは makeCpu で決める) */
  cpu?: string
}

export function startSession({ speed, makeCpu = () => new AI(), resume, onKyokuStart, onGameEnd, practice = false, cpu = 'strong' }: SessionOptions): GameSession {
  const human = new HumanPlayer()
  const players: Player[] = [human, makeCpu(), makeCpu(), makeCpu()]
  const session = {} as GameSession
  const game = new MleagueGame(players, (paipu) => session.onEnd?.(paipu), MLEAGUE_RULE, 'CPU対戦')
  game.model.player = [...PLAYER_NAMES]
  // 盤面が変わるたびに画面へ知らせる
  human.view = {
    kaiju: () => human.notify(),
    redraw: () => human.notify(),
    update: () => human.notify(),
    summary: () => human.notify(),
  } as never
  game.view = {
    update: () => human.notify(),
    summary: () => human.notify(),
    say: (name: string, l: number) => {
      const said = { l, name }
      session.lastSay = said
      human.notify()
      setTimeout(() => {
        if (session.lastSay !== said) return
        session.lastSay = null
        human.notify()
      }, 1500)
    },
    kaiju: () => {},
    redraw: () => {},
  } as never
  Object.assign(session, {
    game,
    human,
    lastSay: null,
    practice,
    cpu,
    setSpeed: (s: GameSpeed) => {
      game.speed = s
    },
  })
  game.speed = speed
  game.onKyokuStart = onKyokuStart
  game.handler = () => {
    if (game.final) onGameEnd?.(game._paipu, game.final)
  }
  if (resume) game.resume(resume)
  else game.kaiju()
  return session
}

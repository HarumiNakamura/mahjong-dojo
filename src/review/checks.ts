// 振り返りの判定(分類ごと)
//
// どの判定も「その場面で見えていた情報」だけを使う(他家の手牌や山は見ない)。
// 指摘の文はテンプレートで作る。しきい値と損失の目安は thresholds.ts。

import Majiang from '@kobalab/majiang-core'
import { analyzeCall, CALL_MARGIN, callLabel, type CallSituation } from '../engine/call'
import { judgeDiscards, type EfficiencyJudgement } from '../engine/efficiency'
import { explainDiscard } from '../engine/efficiencyExplain'
import { evaluatePushFold, type PushFoldResult } from '../engine/pushfold'
import { doraFromIndicator } from '../engine/scoring'
import { isHonor, rankOf, suitOf, tilesToCounts, type Tile } from '../engine/tiles'
import { PUSHFOLD_TABLE } from '../data/pushfold-table'
import { fromPai } from '../game/convert'
import { MLEAGUE_RULE } from '../game/rule'
import { REVIEW_THRESHOLDS as T } from './thresholds'
import type { Finding } from './types'
import { closedTiles, dangerByKind, estimateValue, kindName, paiName, riichiOpponents, visibleTiles, type Scene } from './scene'

type Base = Pick<Finding, 'kyoku' | 'step'>

const yen = (n: number) => `${Math.round(n).toLocaleString('ja-JP')}点`
const shantenWord = (n: number) => (n <= 0 ? 'テンパイ' : `${n}シャンテン`)
const ukeireWord = (shanten: number) => (shanten === 0 ? '待ち' : '受け入れ')

/** 打牌の牌効率の判定(打牌前の14枚)。計算できなければ null */
export function judgeScene(scene: Scene): EfficiencyJudgement | null {
  try {
    return judgeDiscards(closedTiles(scene.board.shoupai[scene.me]), visibleTiles(scene.board))
  } catch {
    return null
  }
}

/**
 * 牌効率では損でも、打点や役のための打牌なら指摘しない。理由(なければ null)を返す。
 * keepKind: 最善手が切る牌(=あなたが残した牌)、chosen: あなたが切った牌
 */
function valueReason(scene: Scene, hand: readonly Tile[], chosen: number, keepKind: number): string | null {
  const counts = tilesToCounts(hand)
  const board = scene.board
  const doraKinds = board.shan.baopai.map((p) => doraFromIndicator(fromPai(p).kind))
  if (doraKinds.includes(keepKind)) return 'ドラを残した'
  if (hand.some((t) => t.kind === keepKind && t.red) && counts[keepKind] === 1) return '赤ドラを残した'
  const yakuhai = [31, 32, 33, 27 + scene.me, 27 + board.zhuangfeng]
  if (yakuhai.includes(keepKind) && counts[keepKind] >= 2) return '役牌の対子を残した'
  // 混一色: 1色 + 字牌が多い手で、ほかの色を切った
  for (const s of [0, 1, 2]) {
    const n = hand.filter((t) => isHonor(t.kind) || suitOf(t.kind) === ['m', 'p', 's'][s]).length
    const inSuit = (k: number) => isHonor(k) || suitOf(k) === ['m', 'p', 's'][s]
    if (n >= T.honitsuMinTiles && !inSuit(chosen) && inSuit(keepKind)) return '混一色を狙った'
  }
  // 断么九: 么九牌を切って、ほとんど2〜8の手にした
  const yaochu = (k: number) => isHonor(k) || rankOf(k) === 1 || rankOf(k) === 9
  if (yaochu(chosen) && !yaochu(keepKind) && hand.filter((t) => yaochu(t.kind)).length <= 2) return '断么九を狙った'
  return null
}

/** 打牌(牌効率) */
export function checkDiscard(scene: Scene, base: Base, pai: string, j: EfficiencyJudgement): Finding | null {
  if (j.analysis.agari) return null
  const chosen = fromPai(pai.slice(0, 2)).kind
  if (j.correctKinds.includes(chosen)) return null
  const opt = j.analysis.options.find((o) => o.tile.kind === chosen)
  if (!opt) return null
  const best = j.best
  const hand = closedTiles(scene.board.shoupai[scene.me])
  if (valueReason(scene, hand, chosen, best.tile.kind)) return null
  const name = kindName(chosen)
  const bestName = kindName(best.tile.kind)
  const better = `${bestName}を切る(${ukeireWord(best.shanten)} ${best.total}枚)`
  const level = Math.min(best.shanten, 3)
  // 何切る・一人麻雀と同じ、牌の役割と有効牌の増減による理由
  const why = explainDiscard(j, chosen, hand).reasons.join('')
  if (opt.shanten > best.shanten) {
    return {
      ...base,
      category: 'discard',
      kind: 'shanten',
      loss: T.shantenStepValue[level] * (opt.shanten - best.shanten),
      title: 'シャンテン数が戻る打牌',
      played: `${name}を切った`,
      better,
      reason: `${name}を切ると${shantenWord(opt.shanten)}に戻ります。${bestName}を切れば${shantenWord(best.shanten)}のまま、${ukeireWord(best.shanten)}は${best.total}枚です。${why}`,
    }
  }
  const diff = best.total - opt.total
  if (diff < T.minUkeireDiff || diff < best.total * T.minUkeireRatio) return null
  return {
    ...base,
    category: 'discard',
    kind: 'ukeire',
    loss: diff * T.ukeireTileValue[level],
    title: best.shanten === 0 ? '待ちの少ない打牌' : '受け入れの少ない打牌',
    played: `${name}を切った(${ukeireWord(best.shanten)} ${opt.total}枚)`,
    better,
    reason: `${bestName}を切ると${ukeireWord(best.shanten)}が${best.total}枚、${name}を切ると${opt.total}枚で、${diff}枚少なくなります。${why}`,
  }
}

export interface DefenseOutcome {
  /** 次の手でロンされた点数(放銃していなければ 0) */
  paid: number
  /** 放銃した相手がリーチしていた */
  toRiichi: boolean
}

/** 押し引きと放銃(リーチを受けている打牌) */
export function checkDefense(scene: Scene, base: Base, pai: string, j: EfficiencyJudgement, outcome: DefenseOutcome): Finding | null {
  const riichi = riichiOpponents(scene)
  if (riichi.length === 0) return null
  const dangers = dangerByKind(scene)
  const chosen = fromPai(pai.slice(0, 2)).kind
  const chosenDanger = dangers.get(chosen)?.danger ?? 0
  let safestKind = chosen
  for (const [k, d] of dangers) if (d.danger < dangers.get(safestKind)!.danger) safestKind = k
  const safest = dangers.get(safestKind)!
  const pushed = chosenDanger >= safest.danger + T.pushDangerMargin
  const shape = j.bestForward
  const chosenOpt = j.analysis.options.find((o) => o.tile.kind === chosen)
  const keepsShape = chosenOpt !== undefined && chosenOpt.shanten === shape.shanten
  const opponentDealer = riichi.includes(0)
  const opponentValue = PUSHFOLD_TABLE.opponentValue.riichi[opponentDealer ? 'dealer' : 'nonDealer']

  let model: PushFoldResult | null = null
  if (shape.shanten <= 1) {
    const good = shape.shanten === 0 ? (shape.waits?.length ?? 0) >= 2 : shape.total >= PUSHFOLD_TABLE.iishantenGoodUkeire
    model = evaluatePushFold({
      shanten: shape.shanten as 0 | 1,
      shape: good ? 'good' : 'bad',
      count: shape.total,
      turn: scene.turn,
      myValue: estimateValue(scene),
      iAmDealer: scene.me === 0,
      opponent: { dealer: opponentDealer, kind: 'riichi' },
      tileDanger: keepsShape ? chosenDanger : (dangers.get(shape.tile.kind)?.danger ?? chosenDanger),
    })
  }
  const name = kindName(chosen)
  const safestText = `${kindName(safestKind)}(${safest.label}・危険度 約${safest.danger}%)`
  const handText = shape.shanten <= 1 ? `${shantenWord(shape.shanten)}(${ukeireWord(shape.shanten)} ${shape.total}枚)` : `${shantenWord(shape.shanten)}`

  // 放銃: より安全な牌があり、押しが正しい場面でもなかった
  if (outcome.paid > 0 && outcome.toRiichi) {
    const justified = model !== null && keepsShape && model.verdict !== 'fold'
    if (!justified && safest.danger <= chosenDanger - T.dealInSaferMargin) {
      return {
        ...base,
        category: 'dealin',
        kind: 'saferTile',
        loss: outcome.paid,
        title: 'より安全な牌があった放銃',
        played: `${name}(危険度 約${chosenDanger}%)を切って${yen(outcome.paid)}の放銃`,
        better: `${safestText}を切る`,
        reason: `リーチを受けていて、手は${handText}でした。${model ? `押し引きの目安では「${model.verdict === 'fold' ? '降り' : 'どちらでも'}」の場面です。` : '2シャンテン以上なので、基本は降りです。'}手の中に${safestText}がありました。`,
      }
    }
    return null
  }

  if (model) {
    if (pushed && keepsShape && model.verdict === 'fold' && -model.diff >= T.minPushFoldDiff) {
      return {
        ...base,
        category: 'pushfold',
        kind: 'overpush',
        loss: -model.diff,
        title: '押しすぎ',
        played: `${name}(危険度 約${chosenDanger}%)を押した`,
        better: `${safestText}を切って降りる`,
        reason: `手は${handText}、打点の目安は${yen(estimateValue(scene))}。押しのアガリ率 約${Math.round(model.winRate * 100)}%に対して放銃率 約${Math.round(model.dealInRate * 100)}%で、押しの期待値が降りより約${yen(-model.diff)}低い計算です。${model.rule}`,
      }
    }
    if (!pushed && !keepsShape && model.verdict === 'push' && model.diff >= T.minPushFoldDiff) {
      const keepName = kindName(shape.tile.kind)
      return {
        ...base,
        category: 'pushfold',
        kind: 'overfold',
        loss: model.diff,
        title: '降りすぎ',
        played: `${name}を切って手を崩した`,
        better: `${keepName}(危険度 約${dangers.get(shape.tile.kind)?.danger ?? 0}%)を切って押す`,
        reason: `手は${handText}、打点の目安は${yen(estimateValue(scene))}。押しのアガリ率 約${Math.round(model.winRate * 100)}%で、押しの期待値が降りより約${yen(model.diff)}高い計算です。${model.rule}`,
      }
    }
    if (pushed && !keepsShape) {
      // 形も崩して危険な牌も切った(どちらの得もない)
      const loss = ((chosenDanger - safest.danger) / 100) * opponentValue
      if (loss < T.minPushFoldDiff) return null
      return {
        ...base,
        category: 'pushfold',
        kind: 'overpush',
        loss,
        title: '押しすぎ',
        played: `手を崩しながら${name}(危険度 約${chosenDanger}%)を切った`,
        better: `${safestText}を切って降りる`,
        reason: `${name}を切っても手は進まず、危険度だけが高い打牌です。降りるなら${safestText}が安全です。`,
      }
    }
    return null
  }

  // 2シャンテン以上: 基本は降り
  if (pushed && chosenDanger >= T.farPushMinDanger) {
    const loss = ((chosenDanger - safest.danger) / 100) * opponentValue
    if (loss < T.minPushFoldDiff / 2) return null
    return {
      ...base,
      category: 'pushfold',
      kind: 'overpush',
      loss,
      title: '遠い手で押した',
      played: `${name}(危険度 約${chosenDanger}%)を切った`,
      better: `${safestText}を切って降りる`,
      reason: `手は${handText}で、リーチ者より先にアガるのは難しい形です。リーチを受けた2シャンテン以上の手は、安全な牌から切って降りるのが基本です。`,
    }
  }
  return null
}

/** 役なしのテンパイで、リーチできたのにしなかった(ロンできない) */
export function checkYakulessDama(scene: Scene, base: Base, pai: string): Finding | null {
  if (pai.endsWith('*')) return null
  const shoupai = scene.board.shoupai[scene.me]
  if (!shoupai.menqian || shoupai.lizhi) return null
  const p = pai.slice(0, 2)
  if (!Majiang.Game.allow_lizhi(MLEAGUE_RULE, shoupai, p, scene.board.shan.paishu, scene.board.defen[scene.board.player_id[scene.me]])) return null
  const after = shoupai.clone().dapai(p)
  const waits = Majiang.Util.tingpai(after) ?? []
  const canRon = waits.some((w) => Majiang.Game.allow_hule(MLEAGUE_RULE, after, `${w}+`, scene.board.zhuangfeng, scene.me, false, true))
  if (canRon) return null
  return {
    ...base,
    category: 'riichi',
    kind: 'yakulessDama',
    loss: T.yakulessDamaLoss,
    title: '役なしのダマテン',
    played: `${paiName(p)}を切ってリーチしなかった`,
    better: `${paiName(p)}を切ってリーチする`,
    reason: `テンパイ(待ち ${waits.map(paiName).join('・')})ですが、役がないのでリーチしないとロンできません(ツモのみ)。リーチすれば役がつき、ロンでもアガれます。`,
  }
}

/** 鳴きの場面(門前13枚の手で、他家の捨て牌 pai を見た) */
function callSituation(scene: Scene, pai: string, from: number): CallSituation {
  const board = scene.board
  return {
    hand: closedTiles(board.shoupai[scene.me]),
    tile: fromPai(pai.slice(0, 2)),
    from: from as 1 | 2 | 3,
    turn: scene.turn,
    doraIndicator: fromPai(board.shan.baopai[0]),
    seatWind: scene.me + 1,
    roundWind: board.zhuangfeng + 1,
  }
}

/** 自分の鳴き(門前からの最初の鳴きだけ調べる。カンは調べない) */
export function checkCall(scene: Scene, base: Base, m: string, discarder: number): Finding | null {
  const shoupai = scene.board.shoupai[scene.me]
  if (!shoupai.menqian) return null
  const digits = m.match(/\d/g) ?? []
  if (digits.length !== 3) return null
  const calledDigit = m.match(/\d(?=[+=-])/)?.[0]
  if (!calledDigit) return null
  const suit = m[0]
  const pai = suit + calledDigit
  const others = [...digits]
  others.splice(others.indexOf(calledDigit), 1)
  const using = others.map((d) => fromPai(suit + d).kind).sort((a, b) => a - b)
  const analysis = analyzeCall(callSituation(scene, pai, (discarder - scene.me + 4) % 4))
  const plain = digits.map((d) => (d === '0' ? '5' : d))
  const type = plain.every((d) => d === plain[0]) ? 'pon' : 'chi'
  const opt = analysis.options.find((o) => o.type === type && o.using[0] === using[0] && o.using[1] === using[1])
  if (!opt || opt.score >= -CALL_MARGIN) return null
  const label = callLabel(type, using)
  const noYaku = opt.best.yaku.length === 0
  const noProgress = !noYaku && opt.best.shanten >= analysis.shanten
  return {
    ...base,
    category: 'call',
    kind: noYaku ? 'noYaku' : noProgress ? 'noProgress' : 'bad',
    loss: noYaku ? T.callNoYakuLoss : noProgress ? T.callNoProgressLoss : T.callBadLoss,
    title: noYaku ? '役のない鳴き' : noProgress ? '手が進まない鳴き' : '鳴かないほうがよい鳴き',
    played: `${paiName(pai)}を${label}`,
    better: 'スルーして門前で進める',
    reason: [...opt.reasons, ...(noYaku ? [] : analysis.closedReasons)].join(''),
  }
}

/** 鳴いたほうがよかった捨て牌を見逃した */
export function checkMissedCall(scene: Scene, base: Base, pai: string, discarder: number): Finding | null {
  const shoupai = scene.board.shoupai[scene.me]
  if (!shoupai.menqian || shoupai.lizhi || scene.board.shan.paishu === 0) return null
  const analysis = analyzeCall(callSituation(scene, pai, (discarder - scene.me + 4) % 4))
  if (analysis.verdict !== 'call') return null
  const best = [...analysis.goodOptions].sort((a, b) => b.score - a.score)[0]
  if (!best || best.score < T.missedCallMinScore) return null
  return {
    ...base,
    category: 'call',
    kind: 'missedCall',
    loss: T.missedCallLoss,
    title: '鳴きどきを見逃した',
    played: `${paiName(pai)}をスルーした`,
    better: `${paiName(pai)}を${callLabel(best.type, best.using)}して${kindName(best.best.kind)}を切る`,
    reason: best.reasons.join(''),
  }
}

/** アガリの点数(本場・供託を含む)。アガれなければ 0 */
function huleValue(scene: Scene, rongpai: string | null, options: { lingshang?: boolean } = {}): number {
  const board = scene.board
  const shoupai = board.shoupai[scene.me]
  const hule = Majiang.Util.hule(shoupai, rongpai, {
    rule: MLEAGUE_RULE,
    zhuangfeng: board.zhuangfeng,
    menfeng: scene.me,
    hupai: {
      lizhi: shoupai.lizhi ? 1 : 0,
      yifa: false,
      qianggang: false,
      lingshang: options.lingshang ?? false,
      haidi: board.shan.paishu > 0 || options.lingshang ? 0 : rongpai ? 2 : 1,
      tianhu: 0,
    },
    baopai: board.shan.baopai,
    fubaopai: null,
    jicun: { changbang: board.changbang, lizhibang: board.lizhibang },
  })
  return hule?.hupai ? hule.defen + board.changbang * 300 + board.lizhibang * 1000 : 0
}

/** ツモアガリを見逃した(ツモした直後の盤面) */
export function checkMissedTsumo(scene: Scene, base: Base, gangzimo: boolean): Finding | null {
  const board = scene.board
  const shoupai = board.shoupai[scene.me]
  const hupai = shoupai.lizhi || board.shan.paishu === 0 || gangzimo
  if (!Majiang.Game.allow_hule(MLEAGUE_RULE, shoupai, null, board.zhuangfeng, scene.me, hupai, true)) return null
  const value = huleValue(scene, null, { lingshang: gangzimo })
  if (value <= 0) return null
  return {
    ...base,
    category: 'missedWin',
    kind: 'missedTsumo',
    loss: value,
    title: 'ツモアガリの見逃し',
    played: 'ツモアガリせずに打牌した',
    better: `ツモでアガる(約${yen(value)})`,
    reason: `この手はアガリの形で、役もあります。ツモと宣言すれば約${yen(value)}を受け取れました。アガれるときは、ボタンが出たら押しましょう。`,
  }
}

/** ロンアガリを見逃した(他家が打牌した直後の盤面) */
export function checkMissedRon(scene: Scene, base: Base, pai: string, discarder: number, nengRong: boolean): Finding | null {
  const board = scene.board
  const shoupai = board.shoupai[scene.me]
  const rongpai = pai.slice(0, 2) + ['', '+', '=', '-'][(4 + discarder - scene.me) % 4]
  const hupai = shoupai.lizhi || board.shan.paishu === 0
  if (!Majiang.Game.allow_hule(MLEAGUE_RULE, shoupai, rongpai, board.zhuangfeng, scene.me, hupai, nengRong)) return null
  const value = huleValue(scene, rongpai)
  if (value <= 0) return null
  return {
    ...base,
    category: 'missedWin',
    kind: 'missedRon',
    loss: value,
    title: 'ロンアガリの見逃し',
    played: `${paiName(pai)}を見逃した`,
    better: `${paiName(pai)}でロンする(約${yen(value)})`,
    reason: `${paiName(pai)}はあなたのアガリ牌で、役もありました。見逃すとフリテンになり、その巡目(リーチ中ならその局ずっと)ロンできなくなります。`,
  }
}

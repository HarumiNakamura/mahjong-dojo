// 守備の判定エンジン
//
// 1. 他家がリーチしている局面を作る(山から配牌し、4人とも簡易プレイヤーで打ち、テンパイした他家はリーチする)
// 2. 自分の手牌の各牌について、リーチ者ごとに安全度の根拠(現物・字牌・スジ・壁・無スジ)を判定する
// 3. 根拠ごとの危険度は src/data/danger-table.ts の目安を使う。リーチ者が複数なら全員分をまとめる
//
// 座席は 0 = 自分、1 = 下家、2 = 対面、3 = 上家。打つ順番は 0 → 1 → 2 → 3。

import { DANGER_TABLE, type NumberGroup } from '../data/danger-table'
import { randomInt, type Rng } from './random'
import { calcShanten, calcShantenFromTiles } from './shanten'
import { formatTiles, isHonor, parseTiles, rankOf, sortTiles, tileName, tilesToCounts, TILE_KINDS, type Tile } from './tiles'
import { findWaits } from './waits'
import { createWall } from './wall'

// ---- 局面 ----

export interface RiverTile {
  tile: Tile
  /** 局全体で何番目の打牌か(0から) */
  order: number
}

export interface DefenseSituation {
  /** 何巡目か(自分のツモの回数) */
  turn: number
  doraIndicator: Tile
  /** 親の座席 */
  dealerSeat: number
  /** 各座席の河 */
  rivers: RiverTile[][]
  /** 各座席のリーチ宣言牌の、河の中での位置(リーチしていなければ null) */
  riichiIndex: (number | null)[]
  /** 自分の手牌(ツモ前の13枚・理牌済み)とツモ牌 */
  myHand: Tile[]
  drawn: Tile
  /** 各座席の手牌(自分以外。リーチ者の手牌は答え合わせ用) */
  hands: Tile[][]
  /** これからツモる牌 */
  wall: Tile[]
  /** 次の打牌の通し番号 */
  nextOrder: number
}

export const SEAT_NAMES = ['自分', '下家', '対面', '上家']

/** リーチしている座席 */
export function riichiSeats(s: DefenseSituation): number[] {
  return [1, 2, 3].filter((seat) => s.riichiIndex[seat] !== null)
}

/** リーチ者の待ち牌(正解データ) */
export function riichiWaits(s: DefenseSituation, seat: number): number[] {
  return findWaits(s.hands[seat]).waits.map((w) => w.kind)
}

/** 自分から見えている牌の枚数(自分の手牌・ツモ牌・全員の河・ドラ表示牌) */
export function visibleCounts(s: DefenseSituation): number[] {
  return tilesToCounts([...s.myHand, s.drawn, ...s.rivers.flatMap((r) => r.map((x) => x.tile)), s.doraIndicator])
}

// ---- 局面を作る ----

export interface SituationOptions {
  /** リーチ者の人数(1か2) */
  riichiCount: 1 | 2
  /** リーチがかかってから、自分のツモまでに最低何巡進めるか */
  minTurnsAfterRiichi?: number
  /** 打ち切る巡目 */
  maxTurn?: number
}

/**
 * 簡易プレイヤーの打牌: シャンテン数が一番進む牌のうち、まわりにつながる牌が少ない(孤立した)牌を切る。
 * リーチ者に当たる牌は切らない(当たり牌しかなければ null)。
 */
function chooseDiscard(hand14: Tile[], avoid: ReadonlySet<number>, rng: Rng): number | null {
  const counts = tilesToCounts(hand14)
  const linkScore = (k: number) => {
    if (isHonor(k)) return counts[k] * 3
    const r = rankOf(k)
    const at = (d: number) => (r + d >= 1 && r + d <= 9 ? counts[k + d] : 0)
    return counts[k] * 3 + (at(-1) + at(1)) * 2 + at(-2) + at(2)
  }
  let best: number[] = []
  let bestShanten = Infinity
  let bestScore = Infinity
  for (let k = 0; k < TILE_KINDS; k++) {
    if (counts[k] === 0 || avoid.has(k)) continue
    counts[k]--
    const sh = calcShanten(counts).min
    counts[k]++
    const score = linkScore(k)
    if (sh < bestShanten || (sh === bestShanten && score < bestScore)) {
      best = [k]
      bestShanten = sh
      bestScore = score
    } else if (sh === bestShanten && score === bestScore) {
      best.push(k)
    }
  }
  if (best.length === 0) return null
  const kind = best[randomInt(rng, best.length)]
  const normal = hand14.findIndex((t) => t.kind === kind && !t.red)
  return normal >= 0 ? normal : hand14.findIndex((t) => t.kind === kind)
}

/** 1局を進めて、条件に合う局面を作る(作れなければ null) */
export function trySituation(rng: Rng, options: SituationOptions): DefenseSituation | null {
  const { riichiCount, minTurnsAfterRiichi = 1, maxTurn = 14 } = options
  const wall = createWall(rng)
  const doraIndicator = wall.pop()!
  wall.splice(wall.length - 13, 13)
  const hands: Tile[][] = [0, 1, 2, 3].map(() => sortTiles(wall.splice(0, 13)))
  const rivers: RiverTile[][] = [[], [], [], []]
  const riichiIndex: (number | null)[] = [null, null, null, null]
  const dealerSeat = randomInt(rng, 4)
  let order = 0
  let turnsSinceFirstRiichi = -1

  for (let turn = 1; turn <= maxTurn && wall.length > 8; turn++) {
    for (let seat = 0; seat < 4; seat++) {
      const drawn = wall.shift()!
      const hand14 = [...hands[seat], drawn]
      if (seat === 0) {
        const riichiNow = riichiSeats({ riichiIndex } as DefenseSituation).length
        if (riichiNow >= riichiCount && turnsSinceFirstRiichi >= minTurnsAfterRiichi) {
          // 自分の番: ここで問題にする
          if (calcShantenFromTiles(hand14).min === -1) return null
          return {
            turn,
            doraIndicator,
            dealerSeat,
            rivers,
            riichiIndex,
            myHand: sortTiles(hands[0]),
            drawn,
            hands,
            wall,
            nextOrder: order,
          }
        }
        if (turnsSinceFirstRiichi >= 0) turnsSinceFirstRiichi++
      }
      // アガリ形になったら(ツモアガリ)、この局は使わない
      if (calcShantenFromTiles(hand14).min === -1) return null
      // リーチ者に当たる牌は切らない(ロンが出ると局面が終わるため)
      const avoid = new Set<number>()
      for (const other of [1, 2, 3]) {
        if (other !== seat && riichiIndex[other] !== null) for (const w of findWaits(hands[other]).waits) avoid.add(w.kind)
      }
      let index: number | null
      if (riichiIndex[seat] !== null) {
        index = avoid.has(hand14[hand14.length - 1].kind) ? null : hand14.length - 1 // リーチ後はツモ切り
      } else {
        index = chooseDiscard(hand14, avoid, rng)
      }
      if (index === null) return null
      const discard = hand14[index]
      hands[seat] = sortTiles(hand14.filter((_, i) => i !== index))
      rivers[seat].push({ tile: discard, order: order++ })
      // 自分以外がテンパイしたらリーチ(リーチ者が予定の人数に達するまで)
      if (
        seat !== 0 &&
        riichiIndex[seat] === null &&
        riichiSeats({ riichiIndex } as DefenseSituation).length < riichiCount &&
        findWaits(hands[seat]).tenpai
      ) {
        riichiIndex[seat] = rivers[seat].length - 1
        if (turnsSinceFirstRiichi < 0) turnsSinceFirstRiichi = 0
      }
    }
  }
  return null
}

/** 条件に合う局面を作る */
export function generateSituation(rng: Rng, options: SituationOptions, maxAttempts = 400): DefenseSituation {
  for (let i = 0; i < maxAttempts; i++) {
    const s = trySituation(rng, options)
    if (s) return s
  }
  throw new Error('リーチの局面を作れませんでした')
}

// ---- 安全度の判定 ----

export type DangerCategory =
  | 'genbutsu'
  | 'honor'
  | 'suji'
  | 'ryousuji'
  | 'sengenSuji'
  | 'katasuji'
  | 'noChance'
  | 'oneChance'
  | 'musuji'

export const CATEGORY_LABELS: Record<DangerCategory, string> = {
  genbutsu: '現物',
  honor: '字牌',
  suji: 'スジ',
  ryousuji: '両スジ',
  sengenSuji: '宣言牌のスジ',
  katasuji: '片スジ',
  noChance: 'ノーチャンス(壁)',
  oneChance: 'ワンチャンス',
  musuji: '無スジ',
}

export interface PlayerSafety {
  /** リーチ者の座席 */
  seat: number
  category: DangerCategory
  /** 表示用(例: 「字牌(2枚見え)」) */
  label: string
  /** 危険度(放銃率の目安、%) */
  danger: number
  /** 根拠の説明 */
  reasons: string[]
  /** 根拠になった河の牌(リーチ者の河での位置。現物・スジの元) */
  riverRefs: { seat: number; index: number }[]
  /** 壁になっている牌の種類 */
  wallKinds: number[]
}

export interface TileSafety {
  kind: number
  /** リーチ者ごとの判定 */
  perPlayer: PlayerSafety[]
  /** リーチ者全員に対する危険度(%) */
  danger: number
}

/** リーチ者 seat に対して安全な牌(現物)の種類と、その元になった河の牌 */
export function genbutsuOf(s: DefenseSituation, seat: number): Map<number, { seat: number; index: number }[]> {
  const result = new Map<number, { seat: number; index: number }[]>()
  const add = (kind: number, ref: { seat: number; index: number }) => {
    if (!result.has(kind)) result.set(kind, [])
    result.get(kind)!.push(ref)
  }
  // リーチ者自身の河(フリテン)
  s.rivers[seat].forEach((r, index) => add(r.tile.kind, { seat, index }))
  // リーチ後に他家が切って通った牌(見逃しでフリテン)
  const ri = s.riichiIndex[seat]
  if (ri !== null) {
    const riichiOrder = s.rivers[seat][ri].order
    s.rivers.forEach((river, other) => {
      if (other === seat) return
      river.forEach((r, index) => {
        if (r.order > riichiOrder) add(r.tile.kind, { seat: other, index })
      })
    })
  }
  return result
}

function numberGroup(kind: number): NumberGroup {
  const r = rankOf(kind)
  if (r === 1 || r === 9) return '19'
  if (r === 2 || r === 8) return '28'
  if (r === 3 || r === 7) return '37'
  return '456'
}

/** 1人のリーチ者に対する、牌1種類の判定 */
export function assessForPlayer(s: DefenseSituation, seat: number, kind: number, visible = visibleCounts(s)): PlayerSafety {
  const name = (k: number) => tileName({ kind: k, red: false })
  const genbutsu = genbutsuOf(s, seat)
  const who = SEAT_NAMES[seat]
  const base = { seat, riverRefs: [] as { seat: number; index: number }[], wallKinds: [] as number[] }

  const g = genbutsu.get(kind)
  if (g) {
    const inOwn = g.some((ref) => ref.seat === seat)
    return {
      ...base,
      category: 'genbutsu',
      label: '現物',
      danger: DANGER_TABLE.genbutsu,
      reasons: [inOwn ? `${who}の河に${name(kind)}があるので、${name(kind)}ではロンできません(フリテン)。` : `リーチのあとに他家が${name(kind)}を切って通っているので、${name(kind)}ではロンできません。`],
      riverRefs: g,
    }
  }

  if (isHonor(kind)) {
    const n = Math.min(3, visible[kind]) as 0 | 1 | 2 | 3
    const reason =
      n === 3
        ? `${name(kind)}は3枚見えているので、当たるのは単騎待ちだけです。`
        : n === 0
          ? `${name(kind)}はまだ1枚も見えていません(生牌)。シャンポン待ちや単騎待ちに当たることがあります。`
          : `${name(kind)}は${n}枚見えています。字牌は両面待ちにならないので、数牌の無スジよりは安全です。`
    return { ...base, category: 'honor', label: `字牌(${n}枚見え)`, danger: DANGER_TABLE.honor[n], reasons: [reason] }
  }

  // 数牌: 両面待ちでこの牌に当たる形(下側 r-2,r-1 / 上側 r+1,r+2)を1つずつ調べる
  const r = rankOf(kind)
  const group = numberGroup(kind)
  type Route = { shape: [number, number]; partner: number; status: 'open' | 'suji' | 'wall' | 'one'; sengen: boolean }
  const routes: Route[] = []
  const riichiTileKind = s.riichiIndex[seat] !== null ? s.rivers[seat][s.riichiIndex[seat]!].tile.kind : null
  const check = (shape: [number, number], partner: number): Route => {
    const g2 = genbutsu.get(partner)
    if (g2) {
      // スジ: 両面待ちのもう片方が現物ならフリテンになるので、この両面待ちはない
      const onlyDeclaration = g2.every((ref) => ref.seat === seat && ref.index === s.riichiIndex[seat]) && partner === riichiTileKind
      return { shape, partner, status: 'suji', sengen: onlyDeclaration }
    }
    const left = shape.map((k) => 4 - visible[k])
    if (left.some((n) => n <= 0)) return { shape, partner, status: 'wall', sengen: false }
    if (left.some((n) => n === 1)) return { shape, partner, status: 'one', sengen: false }
    return { shape, partner, status: 'open', sengen: false }
  }
  if (r >= 4) routes.push(check([kind - 2, kind - 1], kind - 3))
  if (r <= 6) routes.push(check([kind + 1, kind + 2], kind + 3))

  const sujiRoutes = routes.filter((x) => x.status === 'suji')
  const wallRoutes = routes.filter((x) => x.status === 'wall')
  const sujiRefs = sujiRoutes.flatMap((x) => genbutsu.get(x.partner) ?? [])
  const sujiText = (x: Route) => `${name(x.partner)}が現物なので、${name(x.shape[0])}${name(x.shape[1])}の両面待ちでは${name(kind)}に当たりません。`
  const wallText = (x: Route) => {
    const k = x.shape.find((y) => 4 - visible[y] <= 0)!
    return `${name(k)}が4枚見えている(壁)ので、${name(x.shape[0])}${name(x.shape[1])}の両面待ちはありません。`
  }
  const oneText = (x: Route) => {
    const k = x.shape.find((y) => 4 - visible[y] === 1)!
    return `${name(k)}が残り1枚(ワンチャンス)なので、${name(x.shape[0])}${name(x.shape[1])}の両面待ちは少なめです。`
  }
  const rest = '両面待ち以外(嵌張・シャンポン・単騎)には当たることがあります。'

  if (routes.every((x) => x.status === 'suji' || x.status === 'wall')) {
    if (wallRoutes.length === 0) {
      const sengen = sujiRoutes.every((x) => x.sengen)
      const both = sujiRoutes.length === 2
      const value = both ? DANGER_TABLE.ryousuji : DANGER_TABLE.suji[group as Exclude<NumberGroup, '456'>]
      return {
        ...base,
        category: sengen ? 'sengenSuji' : both ? 'ryousuji' : 'suji',
        label: sengen ? '宣言牌のスジ' : both ? '両スジ' : 'スジ',
        danger: Math.round(value * (sengen ? DANGER_TABLE.sengenSujiFactor : 1) * 10) / 10,
        reasons: [
          ...sujiRoutes.map(sujiText),
          ...(sengen ? ['ただしリーチ宣言牌のスジなので、引っかけやシャンポンに少し注意が必要です。'] : []),
          rest,
        ],
        riverRefs: sujiRefs,
      }
    }
    return {
      ...base,
      category: 'noChance',
      label: 'ノーチャンス(壁)',
      danger: DANGER_TABLE.noChance[group],
      reasons: [...wallRoutes.map(wallText), ...sujiRoutes.map(sujiText), rest],
      riverRefs: sujiRefs,
      wallKinds: wallRoutes.flatMap((x) => x.shape.filter((k) => 4 - visible[k] <= 0)),
    }
  }

  const openRoutes = routes.filter((x) => x.status === 'open' || x.status === 'one')
  if (openRoutes.every((x) => x.status === 'one')) {
    return {
      ...base,
      category: 'oneChance',
      label: 'ワンチャンス',
      danger: DANGER_TABLE.oneChance[group],
      reasons: [...openRoutes.map(oneText), ...sujiRoutes.map(sujiText), ...wallRoutes.map(wallText)],
      riverRefs: sujiRefs,
    }
  }
  if (sujiRoutes.length > 0 || wallRoutes.length > 0) {
    // 4・5・6 で片側だけ通っている
    return {
      ...base,
      category: 'katasuji',
      label: '片スジ',
      danger: DANGER_TABLE.katasuji,
      reasons: [...sujiRoutes.map(sujiText), ...wallRoutes.map(wallText), `もう片側(${openRoutes.map((x) => name(x.shape[0]) + name(x.shape[1])).join('・')})の両面待ちには当たります。`],
      riverRefs: sujiRefs,
      wallKinds: wallRoutes.flatMap((x) => x.shape.filter((k) => 4 - visible[k] <= 0)),
    }
  }
  return {
    ...base,
    category: 'musuji',
    label: '無スジ',
    danger: DANGER_TABLE.musuji[group],
    reasons: [`${openRoutes.map((x) => name(x.shape[0]) + name(x.shape[1])).join('・')}の両面待ちに当たる可能性があります。`],
  }
}

/** 牌1種類の、リーチ者全員に対する判定 */
export function assessTile(s: DefenseSituation, kind: number): TileSafety {
  const visible = visibleCounts(s)
  const perPlayer = riichiSeats(s).map((seat) => assessForPlayer(s, seat, kind, visible))
  // 全員に通る確率から、まとめた危険度を出す
  const safe = perPlayer.reduce((p, x) => p * (1 - x.danger / 100), 1)
  return { kind, perPlayer, danger: Math.round((1 - safe) * 1000) / 10 }
}

/** 自分の手牌(14枚)の牌の種類ごとの判定(安全な順) */
export function assessHand(s: DefenseSituation): TileSafety[] {
  const kinds = [...new Set([...s.myHand, s.drawn].map((t) => t.kind))]
  return kinds.map((k) => assessTile(s, k)).sort((a, b) => a.danger - b.danger || a.kind - b.kind)
}

/** その牌がリーチ者の誰かに当たるか(正解データ) */
export function dealsIn(s: DefenseSituation, kind: number): number[] {
  return riichiSeats(s).filter((seat) => riichiWaits(s, seat).includes(kind))
}

/** 危険度が同じものを同じグループにした順位(0 が一番安全) */
export function dangerGroups(list: readonly TileSafety[]): Map<number, number> {
  const values = [...new Set(list.map((x) => x.danger))].sort((a, b) => a - b)
  return new Map(list.map((x) => [x.kind, values.indexOf(x.danger)]))
}

/** テストや問題データ用: 牌の種類が4枚を超えていないか */
export function situationIsConsistent(s: DefenseSituation): boolean {
  const all = [...s.myHand, s.drawn, ...s.hands.slice(1).flat(), ...s.rivers.flatMap((r) => r.map((x) => x.tile)), s.doraIndicator, ...s.wall]
  const counts = tilesToCounts(all)
  return counts.length === TILE_KINDS && counts.every((n) => n <= 4)
}

// ---- 保存と復元(問題データ用) ----

/** 局面を保存できる形。山と、リーチしていない他家の手牌は含めない */
export interface SituationData {
  turn: number
  dealer: number
  dora: string
  /** 各座席の河 */
  rivers: string[]
  /** 打った座席の順番(例: "0123012…")。リーチ後に通った牌(現物)の判定に使う */
  seq: string
  riichi: (number | null)[]
  hand: string
  drawn: string
  /** リーチ者の手牌(リーチしていない座席は空文字) */
  riichiHands: string[]
}

export function situationToData(s: DefenseSituation): SituationData {
  const seq = s.rivers
    .flatMap((river, seat) => river.map((r) => ({ seat, order: r.order })))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.seat)
    .join('')
  return {
    turn: s.turn,
    dealer: s.dealerSeat,
    dora: formatTiles([s.doraIndicator]),
    rivers: s.rivers.map((r) => formatTiles(r.map((x) => x.tile))),
    seq,
    riichi: [...s.riichiIndex],
    hand: formatTiles(s.myHand),
    drawn: formatTiles([s.drawn]),
    riichiHands: s.hands.map((h, seat) => (s.riichiIndex[seat] !== null ? formatTiles(h) : '')),
  }
}

export function situationFromData(value: unknown): DefenseSituation {
  const d = value as Partial<SituationData> | null
  const bad = () => new Error('守備の問題データが正しくありません')
  if (
    !d ||
    typeof d.turn !== 'number' ||
    typeof d.dealer !== 'number' ||
    typeof d.dora !== 'string' ||
    !Array.isArray(d.rivers) ||
    d.rivers.length !== 4 ||
    typeof d.seq !== 'string' ||
    !Array.isArray(d.riichi) ||
    d.riichi.length !== 4 ||
    typeof d.hand !== 'string' ||
    typeof d.drawn !== 'string' ||
    !Array.isArray(d.riichiHands)
  ) {
    throw bad()
  }
  const tilesBySeat = d.rivers.map((r) => parseTiles(String(r)))
  const rivers: RiverTile[][] = [[], [], [], []]
  ;[...d.seq].forEach((c, order) => {
    const seat = Number(c)
    const tile = tilesBySeat[seat]?.[rivers[seat].length]
    if (!tile) throw bad()
    rivers[seat].push({ tile, order })
  })
  if (rivers.some((r, seat) => r.length !== tilesBySeat[seat].length)) throw bad()
  const riichiIndex = d.riichi.map((x) => (typeof x === 'number' ? x : null))
  if (riichiIndex.some((x, seat) => x !== null && (seat === 0 || x >= rivers[seat].length))) throw bad()
  const myHand = parseTiles(d.hand)
  const drawn = parseTiles(d.drawn)
  if (myHand.length !== 13 || drawn.length !== 1) throw bad()
  return {
    turn: d.turn,
    doraIndicator: parseTiles(d.dora)[0],
    dealerSeat: d.dealer,
    rivers,
    riichiIndex,
    myHand,
    drawn: drawn[0],
    hands: [0, 1, 2, 3].map((seat) => parseTiles(String(d.riichiHands?.[seat] ?? ''))),
    wall: [],
    nextOrder: d.seq.length,
  }
}

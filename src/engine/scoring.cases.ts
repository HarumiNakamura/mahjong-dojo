// 点数計算のテストケース(scoring.test.ts で使い、docs/scoring-tests.md にも書き出す)
// 特に書かない限り: 東場・南家(子)・ロン・ドラなし

import type { LimitName, MeldType, WinContext } from './scoring'

export interface ScoringCase {
  id: string
  category: string
  title: string
  /** 副露を除いた手牌(アガリ牌を含む) */
  hand: string
  win: string
  melds?: [MeldType, string][]
  ctx?: Partial<Omit<WinContext, 'doraIndicators' | 'uraDoraIndicators'>> & { dora?: string; ura?: string }
  expect:
    | { ok: false }
    | {
        han?: number
        fu?: number
        limit?: LimitName | null
        /** アガリの点数(本場・供託を含まない) */
        points: number
        /** ロンの支払い、またはツモの [親の支払い, 子の支払い](親のアガリは子の支払いだけ) */
        ron?: number
        tsumo?: [number | null, number]
        total?: number
        yaku?: string[]
        notYaku?: string[]
        yakuman?: string[]
        fuItems?: [string, number][]
        /** 期待するドラの内訳 */
        dora?: [string, number][]
      }
}

const DEALER = { seatWind: 1 }

export const SCORING_CASES: ScoringCase[] = [
  // ---- 点数 ----
  {
    id: 'P01', category: '点数', title: '子の30符4翻ロンは切り上げ満貫で8,000点',
    hand: '234m34588p345567s', win: '3s', ctx: { riichi: true, dora: '1m' },
    expect: { han: 4, fu: 30, limit: 'mangan', points: 8000, ron: 8000, yaku: ['立直', '平和', '断么九'] },
  },
  {
    id: 'P02', category: '点数', title: '親の30符4翻ロンは切り上げ満貫で12,000点',
    hand: '234m34588p345567s', win: '3s', ctx: { ...DEALER, riichi: true, dora: '1m' },
    expect: { han: 4, fu: 30, limit: 'mangan', points: 12000 },
  },
  {
    id: 'P03', category: '点数', title: '子の60符3翻ロンは切り上げ満貫で8,000点',
    hand: '11155m999p111234s', win: '3s', ctx: { riichi: true },
    expect: { han: 3, fu: 60, limit: 'mangan', points: 8000, yaku: ['立直', '三暗刻'] },
  },
  {
    id: 'P04', category: '点数', title: '子の40符3翻ロンは5,200点',
    hand: '222m34588p455667s', win: '5s', ctx: { riichi: true, dora: '4p' },
    expect: { han: 3, fu: 40, limit: null, points: 5200 },
  },
  {
    id: 'P05', category: '点数', title: '親の40符3翻ロンは7,700点',
    hand: '222m34588p455667s', win: '5s', ctx: { ...DEALER, riichi: true, dora: '4p' },
    expect: { han: 3, fu: 40, points: 7700 },
  },
  {
    id: 'P06', category: '点数', title: '子の5翻ツモは満貫 2,000/4,000',
    hand: '234m34588p345567s', win: '3s', ctx: { tsumo: true, riichi: true, dora: '1m' },
    expect: { han: 5, limit: 'mangan', points: 8000, tsumo: [4000, 2000] },
  },
  {
    id: 'P07', category: '点数', title: '子の6翻ロンは跳満 12,000点(一発)',
    hand: '234m34588p345567s', win: '3s', ctx: { riichi: true, ippatsu: true, dora: '7p' },
    expect: { han: 6, limit: 'haneman', points: 12000, yaku: ['一発'] },
  },
  {
    id: 'P07b', category: '点数', title: 'ダブル立直は2翻(立直とは重ならない)。断么九・平和と合わせて30符4翻は切り上げ満貫',
    hand: '234m34588p345567s', win: '3s', ctx: { doubleRiichi: true },
    expect: { han: 4, fu: 30, limit: 'mangan', points: 8000, yaku: ['ダブル立直', '断么九', '平和'] },
  },
  {
    id: 'P08', category: '点数', title: '子の9翻ロンは倍満 16,000点(清一色・一気通貫・平和)',
    hand: '12334455678999p', win: '6p',
    expect: { han: 9, limit: 'baiman', points: 16000, yaku: ['清一色', '一気通貫', '平和'] },
  },
  {
    id: 'P09', category: '点数', title: '子の12翻ツモは三倍満 6,000/12,000',
    hand: '11223345678999m', win: '6m', ctx: { tsumo: true, riichi: true },
    expect: { han: 12, limit: 'sanbaiman', points: 24000, tsumo: [12000, 6000], yaku: ['清一色', '一気通貫', '一盃口', '平和'] },
  },
  {
    id: 'P10', category: '点数', title: '数え役満なし: 15翻でも三倍満 24,000点',
    hand: '11223345678999m', win: '6m', ctx: { tsumo: true, riichi: true, dora: '8m' },
    expect: { han: 15, limit: 'sanbaiman', points: 24000 },
  },
  {
    id: 'P11', category: '点数', title: '子の役満ロンは32,000点(国士無双の単騎)',
    hand: '119m19p19s1234567z', win: '9m',
    expect: { limit: 'yakuman', points: 32000, yakuman: ['国士無双'] },
  },
  {
    id: 'P12', category: '点数', title: '親の役満ロンは48,000点',
    hand: '119m19p19s1234567z', win: '1m', ctx: DEALER,
    expect: { limit: 'yakuman', points: 48000 },
  },
  {
    id: 'P13', category: '点数', title: '子の役満ツモは 8,000/16,000',
    hand: '119m19p19s1234567z', win: '1m', ctx: { tsumo: true },
    expect: { points: 32000, tsumo: [16000, 8000] },
  },
  {
    id: 'P14', category: '点数', title: '親の役満ツモは16,000オール',
    hand: '119m19p19s1234567z', win: '1m', ctx: { ...DEALER, tsumo: true },
    expect: { points: 48000, tsumo: [null, 16000] },
  },
  {
    id: 'P15', category: '点数', title: '子のピンフツモ(20符2翻)は 400/700',
    hand: '123m56799p345678s', win: '3s', ctx: { tsumo: true },
    expect: { han: 2, fu: 20, points: 1500, tsumo: [700, 400], yaku: ['門前清自摸和', '平和'] },
  },
  {
    id: 'P16', category: '点数', title: '親のピンフツモ(20符2翻)は700オール',
    hand: '123m56799p345678s', win: '3s', ctx: { ...DEALER, tsumo: true },
    expect: { han: 2, fu: 20, points: 2100, tsumo: [null, 700] },
  },
  {
    id: 'P17', category: '点数', title: '子の40符1翻ロンは1,300点',
    hand: '123m456p234789s55z', win: '4s', ctx: { riichi: true },
    expect: { han: 1, fu: 40, points: 1300, fuItems: [['雀頭(三元牌)', 2]] },
  },
  {
    id: 'P18', category: '点数', title: '子の30符1翻ツモは 300/500',
    hand: '12355m456p123789s', win: '2s', ctx: { tsumo: true },
    expect: { han: 1, fu: 30, points: 1100, tsumo: [500, 300], fuItems: [['待ち(嵌張)', 2], ['ツモ', 2]] },
  },
  {
    id: 'P19', category: '点数', title: '子の七対子のみのロンは1,600点(25符2翻)',
    hand: '1199m2277p3355s11z', win: '1z',
    expect: { han: 2, fu: 25, points: 1600, yaku: ['七対子'] },
  },
  {
    id: 'P20', category: '点数', title: '子の七対子ツモ(25符3翻)は 800/1,600',
    hand: '1199m2277p3355s11z', win: '1z', ctx: { tsumo: true },
    expect: { han: 3, fu: 25, points: 3200, tsumo: [1600, 800] },
  },
  {
    id: 'P21', category: '点数', title: '子の七対子 25符4翻ロンは6,400点(切り上げ満貫にならない)',
    hand: '2244m336677p5588s', win: '8s', ctx: { riichi: true },
    expect: { han: 4, fu: 25, limit: null, points: 6400, yaku: ['立直', '七対子', '断么九'] },
  },

  // ---- 符 ----
  {
    id: 'F01', category: '符', title: '連風牌(東場の東家)の雀頭は2符',
    hand: '111m456p234789s11z', win: '4s', ctx: { ...DEALER, riichi: true },
    expect: { fu: 40, points: 2000, fuItems: [['雀頭(連風牌)', 2], ['暗刻(么九牌)', 8], ['門前ロン', 10]] },
  },
  {
    id: 'F02', category: '符', title: '場風の雀頭は2符',
    hand: '111m456p234789s11z', win: '4s', ctx: { riichi: true },
    expect: { fu: 40, points: 1300, fuItems: [['雀頭(場風)', 2]] },
  },
  {
    id: 'F03', category: '符', title: '自風の雀頭は2符',
    hand: '111m456p234789s22z', win: '4s', ctx: { riichi: true },
    expect: { fu: 40, points: 1300, fuItems: [['雀頭(自風)', 2]] },
  },
  {
    id: 'F04', category: '符', title: '客風(西)の雀頭は0符(38符→40符)',
    hand: '111m456p234789s33z', win: '4s', ctx: { riichi: true },
    expect: { fu: 40, points: 1300 },
  },
  {
    id: 'F05', category: '符', title: 'ロンで完成したシャンポンの刻子は明刻(50符・三暗刻にならない)',
    hand: '111m999p45556999s', win: '9s', ctx: { riichi: true },
    expect: { fu: 50, han: 1, points: 1600, notYaku: ['三暗刻'], fuItems: [['明刻(么九牌)', 4]] },
  },
  {
    id: 'F06', category: '符', title: '同じ形のツモは暗刻(三暗刻・50符4翻で満貫)',
    hand: '111m999p45556999s', win: '9s', ctx: { tsumo: true, riichi: true },
    expect: { fu: 50, han: 4, limit: 'mangan', points: 8000, yaku: ['三暗刻', '門前清自摸和'] },
  },
  {
    id: 'F07', category: '符', title: '明刻・暗槓・暗刻・単騎の合計(64符→70符、70符3翻は満貫)',
    hand: '55566s', win: '6s', melds: [['pon', '222m'], ['pon', '999p'], ['ankan', '1111z']],
    expect: {
      fu: 70, han: 3, limit: 'mangan', points: 8000, yaku: ['対々和', '場風牌'],
      fuItems: [['明刻(中張牌)', 2], ['明刻(么九牌)', 4], ['暗槓(么九牌)', 32], ['暗刻(中張牌)', 4], ['待ち(単騎)', 2]],
    },
  },
  {
    id: 'F08', category: '符', title: '辺張待ちは2符',
    hand: '12355m456p345789s', win: '3m', ctx: { riichi: true },
    expect: { fu: 40, points: 1300, fuItems: [['待ち(辺張)', 2]], notYaku: ['平和'] },
  },
  {
    id: 'F09', category: '符', title: '両面とも嵌張とも取れるときは高い方(平和ツモ)を選ぶ',
    hand: '234m34588p455667s', win: '5s', ctx: { tsumo: true },
    expect: { han: 3, fu: 20, points: 2700, tsumo: [1300, 700], yaku: ['平和', '門前清自摸和', '断么九'] },
  },
  {
    id: 'F10', category: '符', title: '鳴いたピンフ形のロンは30符(喰いタン 1,000点)',
    hand: '45688p345678s', win: '5s', melds: [['chi', '234m']],
    expect: { han: 1, fu: 30, points: 1000, yaku: ['断么九'], fuItems: [['鳴いたピンフ形のロン(30符にする)', 10]] },
  },
  {
    id: 'F11', category: '符', title: '平和のロンは30符',
    hand: '123m56799p345678s', win: '3s', ctx: { riichi: true },
    expect: { han: 2, fu: 30, points: 2000, fuItems: [['門前ロン', 10]] },
  },
  {
    id: 'F12', category: '符', title: '役牌の雀頭があると平和にならない(ツモ符も付く)',
    hand: '123m567p345678s11z', win: '3s', ctx: { tsumo: true },
    expect: { han: 1, fu: 30, points: 1100, notYaku: ['平和'], fuItems: [['ツモ', 2], ['雀頭(場風)', 2]] },
  },

  // ---- 役 ----
  {
    id: 'Y01', category: '役', title: '平和・一盃口',
    hand: '223344m456p55789s', win: '4m',
    expect: { han: 2, fu: 30, points: 2000, yaku: ['平和', '一盃口'] },
  },
  {
    id: 'Y02', category: '役', title: '二盃口(3翻)は七対子より高く数える',
    hand: '223344m556677p11z', win: '4m',
    expect: { han: 3, fu: 40, points: 5200, yaku: ['二盃口'], notYaku: ['一盃口', '七対子'] },
  },
  {
    id: 'Y03', category: '役', title: '役牌 白(ポン)',
    hand: '123m22456p789s', win: '9s', melds: [['pon', '555z']],
    expect: { han: 1, fu: 30, points: 1000, yaku: ['役牌 白'] },
  },
  {
    id: 'Y04', category: '役', title: '親・東場の東の暗刻はダブ東(自風+場風で2翻)',
    hand: '123m456p78999s111z', win: '7s', ctx: DEALER,
    expect: { han: 2, fu: 40, points: 3900, yaku: ['自風牌', '場風牌'] },
  },
  {
    id: 'Y05', category: '役', title: '三色同順(門前2翻)',
    hand: '123456m123p12399s', win: '6m',
    expect: { han: 3, fu: 30, points: 3900, yaku: ['三色同順', '平和'] },
  },
  {
    id: 'Y06', category: '役', title: '三色同順(鳴き1翻)',
    hand: '123456m123p99s', win: '6m', melds: [['chi', '123s']],
    expect: { han: 1, fu: 30, points: 1000, yaku: ['三色同順'] },
  },
  {
    id: 'Y07', category: '役', title: '一気通貫(門前2翻)',
    hand: '123456789m234p55s', win: '9m',
    expect: { han: 3, fu: 30, points: 3900, yaku: ['一気通貫', '平和'] },
  },
  {
    id: 'Y08', category: '役', title: '一気通貫(鳴き1翻)',
    hand: '123456m234p55s', win: '6m', melds: [['chi', '789m']],
    expect: { han: 1, fu: 30, points: 1000, yaku: ['一気通貫'] },
  },
  {
    id: 'Y09', category: '役', title: '混全帯么九(門前2翻)',
    hand: '123789m123p789s11z', win: '1p',
    expect: { han: 2, fu: 40, points: 2600, yaku: ['混全帯么九'], notYaku: ['平和'] },
  },
  {
    id: 'Y10', category: '役', title: '純全帯么九(門前3翻)+平和 = 30符4翻で満貫',
    hand: '123789m123p78999s', win: '1p',
    expect: { han: 4, fu: 30, limit: 'mangan', points: 8000, yaku: ['純全帯么九', '平和'], notYaku: ['混全帯么九'] },
  },
  {
    id: 'Y11', category: '役', title: '純全帯么九(鳴き2翻)',
    hand: '123789m123p99s', win: '1p', melds: [['chi', '789s']],
    expect: { han: 2, fu: 30, points: 2000, yaku: ['純全帯么九'] },
  },
  {
    id: 'Y12', category: '役', title: '対々和',
    hand: '77788s333z', win: '3z', melds: [['pon', '222m'], ['pon', '555p']],
    expect: { han: 2, fu: 40, points: 2600, yaku: ['対々和'], notYaku: ['三暗刻'] },
  },
  {
    id: 'Y13', category: '役', title: '三色同刻・三暗刻・断么九',
    hand: '222345m22266p222s', win: '5m',
    expect: { han: 5, limit: 'mangan', points: 8000, yaku: ['三色同刻', '三暗刻', '断么九'] },
  },
  {
    id: 'Y14', category: '役', title: '三槓子(60符3翻で切り上げ満貫)',
    hand: '567m88p', win: '8p', melds: [['minkan', '2222m'], ['minkan', '3333p'], ['ankan', '4444s']],
    expect: { han: 3, fu: 60, limit: 'mangan', points: 8000, yaku: ['三槓子', '断么九'] },
  },
  {
    id: 'Y15', category: '役', title: '小三元(役牌2つと合わせて4翻)',
    hand: '123m456p66677z', win: '4p', melds: [['pon', '555z']],
    expect: { han: 4, fu: 40, limit: 'mangan', points: 8000, yaku: ['小三元', '役牌 白', '役牌 發'] },
  },
  {
    id: 'Y16', category: '役', title: '混老頭・対々和',
    hand: '999s22333z', win: '2z', melds: [['pon', '111m'], ['pon', '999p']],
    expect: { han: 4, fu: 50, limit: 'mangan', points: 8000, yaku: ['混老頭', '対々和'], notYaku: ['混全帯么九'] },
  },
  {
    id: 'Y17', category: '役', title: '混一色(門前3翻)',
    hand: '123345999m11333z', win: '5m',
    expect: { han: 3, fu: 50, points: 6400, yaku: ['混一色'] },
  },
  {
    id: 'Y18', category: '役', title: '混一色(鳴き2翻)',
    hand: '123345999m11z', win: '5m', melds: [['pon', '333z']],
    expect: { han: 2, fu: 40, points: 2600, yaku: ['混一色'] },
  },
  {
    id: 'Y19', category: '役', title: '清一色(鳴き5翻)・一気通貫(鳴き1翻)で跳満',
    hand: '34455678999p', win: '6p', melds: [['chi', '123p']],
    expect: { han: 6, limit: 'haneman', points: 12000, yaku: ['清一色', '一気通貫'], notYaku: ['混一色'] },
  },
  {
    id: 'Y20', category: '役', title: '七対子・混老頭',
    hand: '1199m1199p11s1122z', win: '2z',
    expect: { han: 4, fu: 25, points: 6400, yaku: ['七対子', '混老頭'] },
  },
  {
    id: 'Y21', category: '役', title: '嶺上開花(暗槓しても門前)',
    hand: '12322m456p789s', win: '9s', melds: [['ankan', '5555s']], ctx: { tsumo: true, rinshan: true },
    expect: { han: 2, fu: 40, points: 2700, yaku: ['門前清自摸和', '嶺上開花'] },
  },
  {
    id: 'Y22', category: '役', title: '搶槓',
    hand: '123m456p234789s55z', win: '4s', ctx: { chankan: true },
    expect: { han: 1, fu: 40, points: 1300, yaku: ['搶槓'] },
  },
  {
    id: 'Y23', category: '役', title: '海底摸月',
    hand: '12355m456p123789s', win: '2s', ctx: { tsumo: true, haitei: true },
    expect: { han: 2, fu: 30, points: 2000, yaku: ['海底摸月', '門前清自摸和'] },
  },
  {
    id: 'Y24', category: '役', title: '河底撈魚',
    hand: '123m456p234789s55z', win: '4s', ctx: { houtei: true },
    expect: { han: 1, points: 1300, yaku: ['河底撈魚'] },
  },
  {
    id: 'Y25', category: '役', title: 'ダブル立直(2翻。立直は付かない)',
    hand: '123m456p234789s55z', win: '4s', ctx: { doubleRiichi: true },
    expect: { han: 2, fu: 40, points: 2600, yaku: ['ダブル立直'], notYaku: ['立直'] },
  },
  {
    id: 'Y26', category: '役', title: '役がない鳴き手はアガれない',
    hand: '55m456p123789s', win: '1s', melds: [['chi', '123m']],
    expect: { ok: false },
  },
  {
    id: 'Y27', category: '役', title: 'ドラだけではアガれない',
    hand: '55m456p123789s', win: '1s', melds: [['chi', '123m']], ctx: { dora: '4m' },
    expect: { ok: false },
  },
  {
    id: 'Y28', category: '役', title: 'ドラ・裏ドラ・赤ドラ(リーチあり)',
    hand: '234m34088p345567s', win: '3s', ctx: { riichi: true, dora: '1m', ura: '7p' },
    expect: { han: 7, limit: 'haneman', points: 12000, dora: [['ドラ', 1], ['裏ドラ', 2], ['赤ドラ', 1]] },
  },
  {
    id: 'Y29', category: '役', title: '裏ドラはリーチしていないと数えない',
    hand: '234m34088p345567s', win: '3s', ctx: { dora: '1m', ura: '7p' },
    expect: { han: 4, fu: 30, points: 8000, dora: [['ドラ', 1], ['赤ドラ', 1]] },
  },
  {
    id: 'Y30', category: '役', title: 'カンドラを含む複数のドラ表示牌(北→東・中→白の巡回)',
    hand: '123m456p234789s55z', win: '4s', ctx: { riichi: true, dora: '3m4z4p7z' },
    expect: { han: 4, fu: 40, limit: 'mangan', points: 8000, dora: [['ドラ', 3]] },
  },

  // ---- 役満 ----
  {
    id: 'D01', category: '役満', title: '国士無双13面待ち(アガリ牌が雀頭になる形)でもダブル役満にしない',
    hand: '119m19p19s1234567z', win: '1m',
    expect: { points: 32000, yakuman: ['国士無双'] },
  },
  {
    id: 'D02', category: '役満', title: '四暗刻(ツモ)',
    hand: '11199m333p555777s', win: '7s', ctx: { tsumo: true },
    expect: { points: 32000, tsumo: [16000, 8000], yakuman: ['四暗刻'] },
  },
  {
    id: 'D03', category: '役満', title: '四暗刻単騎でもダブル役満にしない',
    hand: '11199m333p555777s', win: '9m',
    expect: { points: 32000, yakuman: ['四暗刻'] },
  },
  {
    id: 'D04', category: '役満', title: 'シャンポンのロンは四暗刻にならない(対々和・三暗刻で満貫)',
    hand: '11199m333p555777s', win: '7s',
    expect: { han: 4, fu: 50, limit: 'mangan', points: 8000, yaku: ['対々和', '三暗刻'] },
  },
  {
    id: 'D05', category: '役満', title: '大三元',
    hand: '123m99p777z', win: '3m', melds: [['pon', '555z'], ['pon', '666z']],
    expect: { points: 32000, yakuman: ['大三元'] },
  },
  {
    id: 'D06', category: '役満', title: '字一色+大三元は2倍役満(64,000点)',
    hand: '11122666777z', win: '2z', melds: [['pon', '555z']],
    expect: { points: 64000, yakuman: ['字一色', '大三元'] },
  },
  {
    id: 'D07', category: '役満', title: '小四喜',
    hand: '123m33344z', win: '4z', melds: [['pon', '111z'], ['pon', '222z']],
    expect: { points: 32000, yakuman: ['小四喜'] },
  },
  {
    id: 'D08', category: '役満', title: '大四喜でもダブル役満にしない',
    hand: '55m333444z', win: '5m', melds: [['pon', '111z'], ['pon', '222z']],
    expect: { points: 32000, yakuman: ['大四喜'] },
  },
  {
    id: 'D09', category: '役満', title: '緑一色(發なしでも成立)',
    hand: '22223344666888s', win: '3s',
    expect: { points: 32000, yakuman: ['緑一色'] },
  },
  {
    id: 'D10', category: '役満', title: '清老頭',
    hand: '111999m111999p99s', win: '9p',
    expect: { points: 32000, yakuman: ['清老頭'] },
  },
  {
    id: 'D11', category: '役満', title: '四槓子',
    hand: '77z', win: '7z', melds: [['minkan', '2222m'], ['ankan', '3333p'], ['minkan', '4444s'], ['minkan', '5555m']],
    expect: { points: 32000, yakuman: ['四槓子'] },
  },
  {
    id: 'D12', category: '役満', title: '純正九蓮宝燈でもダブル役満にしない',
    hand: '11123455678999m', win: '5m',
    expect: { points: 32000, yakuman: ['九蓮宝燈'] },
  },
  {
    id: 'D13', category: '役満', title: '天和(親)は16,000オール',
    hand: '123m56799p345678s', win: '3s', ctx: { ...DEALER, tsumo: true, tenhou: true },
    expect: { points: 48000, tsumo: [null, 16000], yakuman: ['天和'] },
  },
  {
    id: 'D14', category: '役満', title: '地和(子)は 8,000/16,000',
    hand: '123m56799p345678s', win: '3s', ctx: { tsumo: true, chiihou: true },
    expect: { points: 32000, tsumo: [16000, 8000], yakuman: ['地和'] },
  },
  {
    id: 'D15', category: '役満', title: '四暗刻+字一色は2倍役満',
    hand: '11122255566677z', win: '1z', ctx: { tsumo: true },
    expect: { points: 64000, yakuman: ['字一色', '四暗刻'] },
  },

  // ---- 本場・供託 ----
  {
    id: 'E01', category: '本場・供託', title: 'ロン: 2本場(600点)と供託1本(1,000点)を加える',
    hand: '234m34588p345567s', win: '3s', ctx: { riichi: true, dora: '1m', honba: 2, riichiSticks: 1 },
    expect: { points: 8000, total: 9600 },
  },
  {
    id: 'E02', category: '本場・供託', title: '子のツモ: 1本場は各100点ずつ(合計300点)',
    hand: '123m56799p345678s', win: '3s', ctx: { tsumo: true, honba: 1 },
    expect: { points: 1500, total: 1800 },
  },
  {
    id: 'E03', category: '本場・供託', title: '親のツモ: 3本場は各300点ずつ(合計900点)',
    hand: '123m56799p345678s', win: '3s', ctx: { ...DEALER, tsumo: true, honba: 3 },
    expect: { points: 2100, total: 3000 },
  },

  // ---- 入力チェック ----
  {
    id: 'V01', category: '入力チェック', title: 'アガリの形でなければアガれない',
    hand: '123m456p789s12345z', win: '1z',
    expect: { ok: false },
  },
  {
    id: 'V02', category: '入力チェック', title: '手牌の枚数が合わない',
    hand: '123m456p789s1122z', win: '1z',
    expect: { ok: false },
  },
  {
    id: 'V03', category: '入力チェック', title: 'リーチしていないのに一発',
    hand: '123m456p234789s55z', win: '4s', ctx: { ippatsu: true },
    expect: { ok: false },
  },
  {
    id: 'V04', category: '入力チェック', title: '鳴いているのにリーチ',
    hand: '45688p345678s', win: '5s', melds: [['chi', '234m']], ctx: { riichi: true },
    expect: { ok: false },
  },
]

// 採用ルールの設定(Mリーグ公式ルール準拠)
// 詳細は docs/rules.md を参照。ルールの値はこのファイルだけに書き、engine の各処理はここを参照する。

export const RULES = {
  // 基本
  players: 4,
  /** 東南戦(半荘)。西入なし */
  rounds: ['east', 'south'],
  westRound: false,
  startingPoints: 25000,
  returnPoints: 30000,
  /** トビ(持ち点マイナスで終了)の有無 */
  bust: false,

  // 赤ドラ(各色の枚数)
  redFives: { m: 1, p: 1, s: 1 },

  // アガリの条件
  minHan: 1,
  kuitan: true,
  atozuke: true,
  kuikae: false,

  // ドラ
  uraDora: true,
  kanDora: true,
  /** カンドラはカン成立時に即めくる */
  kanDoraImmediate: true,
  kanUraDora: true,

  // リーチ
  ippatsu: true,
  doubleRiichi: true,
  furitenRiichi: true,
  /** ツモ番のないリーチ(海底をツモった人は不可) */
  riichiWithoutNextDraw: true,
  /** リーチ後の暗槓(面子構成が変わらない場合のみ) */
  ankanAfterRiichi: 'if-structure-unchanged',

  // フリテン
  temporaryFuriten: true,
  riichiFuriten: true,

  // 流局・ロンの重なり
  abortiveDraws: false,
  multipleRon: false,
  /** 頭ハネの優先順(放銃者から見た相対位置: 1=下家, 2=対面, 3=上家) */
  headBumpOrder: [1, 2, 3],
  notenPenaltyTotal: 3000,
  /** 形式テンパイ(役なしテンパイ)を認める。当たり牌を自分ですべて使っている場合はノーテン */
  formalTenpai: true,

  // 親・積み棒・供託
  dealerRepeatOnTenpai: true,
  agariYame: false,
  honbaValue: 300,
  /** 親ノーテン流局でも本場を積む */
  honbaOnDealerNotenDraw: true,
  /** 南4局流局時に残った供託はトップが取得 */
  leftoverRiichiToTop: true,

  // 最終成績(1,000点 = 1pt)。1位の値はオカ込み
  uma: [50000, 10000, -10000, -30000],
  tieSplitsUma: true,

  // 符
  fu: {
    base: 20,
    closedRon: 10,
    tsumo: 2,
    pinfuTsumo: 20,
    /** 辺張・嵌張・単騎 */
    singleWait: 2,
    /** 役牌の雀頭。連風牌の雀頭も同じ */
    valuePair: 2,
    doubleWindPair: 2,
    openPinfuRon: 30,
    chiitoitsu: 25,
  },

  // 点数
  kiriageMangan: true,
  /** 満貫以上の翻数の下限 */
  limitHan: { mangan: 5, haneman: 6, baiman: 8, sanbaiman: 11 },
  kazoeYakuman: false,

  // 役満
  yakumanStacking: true,
  doubleYakumanVariants: false,
  ryuuiisouWithoutHatsu: true,
  renhou: false,
  nagashiMangan: false,

  // パオ(大三元・大四喜・四槓子)。ロンは放銃者と折半、積み棒は鳴かせた人が負担
  pao: ['daisangen', 'daisuushii', 'suukantsu'],

  // 搶槓
  chankanOnAnkan: false,
} as const

export type Rules = typeof RULES

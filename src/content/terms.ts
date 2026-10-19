// 麻雀の用語データ(用語集ページと用語部品 Term の両方がここを使う)
//
// 新しい用語はここに足す。id は用語集の目印(/learn/glossary#<id>)になるので、一度決めたら変えない。
// meaning は40字以内。tiles は牌の文字列表記(例: '123m')。article は詳しく説明している記事のパス。

export const TERM_CATEGORIES = ['基本', '牌と形', '待ち', '手役・鳴き', '守備', '点数'] as const
export type TermCategory = (typeof TERM_CATEGORIES)[number]

export interface Term {
  id: string
  word: string
  /** 読み(カタカナ) */
  reading: string
  /** 別名・表記ゆれ(この言葉でも同じ用語として探せる) */
  aliases?: string[]
  /** 一言の意味(40字以内) */
  meaning: string
  /** 牌の例 */
  tiles?: string
  /** 詳しい説明の記事 */
  article?: string
  category: TermCategory
}

export const TERMS: readonly Term[] = [
  // ---- 基本 ----
  { id: 'hanchan', word: '半荘', reading: 'ハンチャン', aliases: ['東南戦'], meaning: '東1局から南4局までの1回の対局', category: '基本', article: '/learn/flow' },
  { id: 'kyoku', word: '局', reading: 'キョク', meaning: '配牌からアガリか流局までの1回', category: '基本', article: '/learn/flow' },
  { id: 'oya', word: '親', reading: 'オヤ', meaning: '局ごとに1人。アガったときの点数が子の1.5倍になる', category: '基本' },
  { id: 'ko', word: '子', reading: 'コ', meaning: '親以外の3人', category: '基本' },
  { id: 'renchan', word: '連荘', reading: 'レンチャン', meaning: '親がアガるかテンパイで流局し、続けて親をすること', category: '基本' },
  { id: 'haipai', word: '配牌', reading: 'ハイパイ', meaning: '局の最初に配られる13枚の手牌', category: '基本' },
  { id: 'tsumo', word: 'ツモ', reading: 'ツモ', aliases: ['自摸', 'ツモアガリ'], meaning: '山から牌を1枚引くこと。引いた牌で自分でアガること', category: '基本' },
  { id: 'ron', word: 'ロン', reading: 'ロン', meaning: 'ほかの人が捨てた牌でアガること', category: '基本' },
  { id: 'agari', word: 'アガリ', reading: 'アガリ', aliases: ['和了', 'アガる'], meaning: '手を完成させて点数をもらうこと', category: '基本' },
  { id: 'kawa', word: '河', reading: 'カワ', aliases: ['捨て牌'], meaning: '切った牌を並べる場所。そこにある捨て牌のこと', category: '基本' },
  { id: 'yama', word: '山', reading: 'ヤマ', aliases: ['牌山'], meaning: 'ツモる牌を積んだもの', category: '基本' },
  { id: 'wanpai', word: '王牌', reading: 'ワンパイ', meaning: '山の最後の14枚。ドラ表示牌と嶺上牌がある', category: '基本' },
  { id: 'kamicha', word: '上家', reading: 'カミチャ', meaning: '自分の左隣の人。自分の1つ前に打つ', category: '基本' },
  { id: 'shimocha', word: '下家', reading: 'シモチャ', meaning: '自分の右隣の人。自分の次に打つ', category: '基本' },
  { id: 'toimen', word: '対面', reading: 'トイメン', meaning: '自分の向かいの人', category: '基本' },
  { id: 'tacha', word: '他家', reading: 'ターチャ', meaning: '自分以外の3人', category: '基本' },
  { id: 'junme', word: '巡目', reading: 'ジュンメ', aliases: ['巡'], meaning: '自分が何回ツモったか。局の進み具合を表す', category: '基本' },
  { id: 'ryukyoku', word: '流局', reading: 'リュウキョク', meaning: '山がなくなり、誰もアガらずに局が終わること', category: '基本' },
  { id: 'orasu', word: 'オーラス', reading: 'オーラス', meaning: '最後の局(南4局)', category: '基本', article: '/learn/all-last' },
  { id: 'tenbou', word: '点棒', reading: 'テンボウ', meaning: '点数のやりとりに使う棒', category: '基本' },

  // ---- 牌と形 ----
  { id: 'manzu', word: '萬子', reading: 'マンズ', meaning: '「萬」の字が書かれた数牌。1〜9が4枚ずつ', tiles: '123456789m', category: '牌と形' },
  { id: 'pinzu', word: '筒子', reading: 'ピンズ', meaning: '丸い模様の数牌。1〜9が4枚ずつ', tiles: '123456789p', category: '牌と形' },
  { id: 'souzu', word: '索子', reading: 'ソーズ', meaning: '竹の模様の数牌。1〜9が4枚ずつ', tiles: '123456789s', category: '牌と形' },
  { id: 'suhai', word: '数牌', reading: 'シューパイ', meaning: '萬子・筒子・索子の1〜9の牌', category: '牌と形' },
  { id: 'jihai', word: '字牌', reading: 'ジハイ', meaning: '東南西北の風牌と、白發中の三元牌', tiles: '1234567z', category: '牌と形' },
  { id: 'kazehai', word: '風牌', reading: 'カゼハイ', meaning: '東・南・西・北の4種類の字牌', tiles: '1234z', category: '牌と形' },
  { id: 'sangenpai', word: '三元牌', reading: 'サンゲンパイ', meaning: '白・發・中の3種類の字牌', tiles: '567z', category: '牌と形' },
  { id: 'yaochuhai', word: '么九牌', reading: 'ヤオチューハイ', aliases: ['ヤオチュー牌', '么九'], meaning: '1と9の数牌と字牌', tiles: '19m19p19s', category: '牌と形' },
  { id: 'chunchanpai', word: '中張牌', reading: 'チュンチャンパイ', meaning: '2〜8の数牌', tiles: '2345678m', category: '牌と形' },
  { id: 'mentsu', word: '面子', reading: 'メンツ', meaning: '順子か刻子の3枚1組。アガリ形には4つ必要', tiles: '123m555p', category: '牌と形' },
  { id: 'shuntsu', word: '順子', reading: 'シュンツ', meaning: '同じ色で数字が3つ続いた3枚', tiles: '345m', category: '牌と形' },
  { id: 'kotsu', word: '刻子', reading: 'コーツ', aliases: ['暗刻', '明刻'], meaning: '同じ牌3枚', tiles: '777p', category: '牌と形' },
  { id: 'kantsu', word: '槓子', reading: 'カンツ', meaning: '同じ牌4枚。カンをするとできる', tiles: '5555s', category: '牌と形' },
  { id: 'toitsu', word: '対子', reading: 'トイツ', meaning: '同じ牌2枚', tiles: '99s', category: '牌と形' },
  { id: 'jantou', word: '雀頭', reading: 'ジャントウ', aliases: ['頭', 'アタマ'], meaning: 'アガリ形に1組だけ入る、同じ牌2枚', tiles: '55z', category: '牌と形' },
  { id: 'taatsu', word: 'ターツ', reading: 'ターツ', aliases: ['搭子'], meaning: 'あと1枚で順子になる2枚', tiles: '23m', category: '牌と形', article: '/learn/efficiency' },
  { id: 'koritsuhai', word: '孤立牌', reading: 'コリツハイ', aliases: ['孤立'], meaning: 'ほかのどの牌ともつながっていない1枚', tiles: '1z', category: '牌と形', article: '/learn/efficiency' },
  { id: 'shanten', word: 'シャンテン数', reading: 'シャンテンスウ', aliases: ['シャンテン', '向聴'], meaning: 'テンパイまであと何枚の牌が必要かを表す数', category: '牌と形', article: '/learn/efficiency' },
  { id: 'iishanten', word: 'イーシャンテン', reading: 'イーシャンテン', aliases: ['一向聴', '1シャンテン'], meaning: 'あと1枚でテンパイになる状態', category: '牌と形', article: '/learn/efficiency' },
  { id: 'tenpai', word: 'テンパイ', reading: 'テンパイ', aliases: ['聴牌'], meaning: 'あと1枚でアガれる状態', category: '牌と形' },
  { id: 'noten', word: 'ノーテン', reading: 'ノーテン', aliases: ['不聴'], meaning: '流局したときにテンパイしていないこと', category: '牌と形' },
  { id: 'ukeire', word: '受け入れ枚数', reading: 'ウケイレマイスウ', aliases: ['受け入れ'], meaning: '引くと手が進む牌が、残り何枚あるか', category: '牌と形', article: '/learn/ukeire' },
  { id: 'yukohai', word: '有効牌', reading: 'ユウコウハイ', meaning: '引くとシャンテン数が進む牌', category: '牌と形', article: '/learn/ukeire' },
  { id: 'ryokei', word: '良形', reading: 'リョウケイ', aliases: ['好形'], meaning: '両面など、待ちが広い形', category: '牌と形', article: '/learn/good-shape' },
  { id: 'gukei', word: '愚形', reading: 'グケイ', meaning: '嵌張・辺張・単騎など、待ちが狭い形', category: '牌と形', article: '/learn/good-shape' },
  { id: 'shanten-modoshi', word: 'シャンテン戻し', reading: 'シャンテンモドシ', aliases: ['戻し'], meaning: 'わざとシャンテン数を1つ戻し、受け入れを広げる打牌', category: '牌と形', article: '/learn/shanten-back' },
  { id: 'nanikiru', word: '何切る', reading: 'ナニキル', meaning: '14枚の手からどの牌を切るかを考える問題', category: '牌と形', article: '/learn/efficiency' },

  // ---- 待ち ----
  { id: 'machi', word: '待ち', reading: 'マチ', aliases: ['待ち牌', '当たり牌'], meaning: 'テンパイしているときに、来ればアガれる牌', category: '待ち', article: '/learn/waits' },
  { id: 'ryanmen', word: '両面', reading: 'リャンメン', aliases: ['両面待ち'], meaning: '23で1と4を待つような形。最大8枚', tiles: '23m', category: '待ち', article: '/learn/waits' },
  { id: 'kanchan', word: '嵌張', reading: 'カンチャン', aliases: ['嵌張待ち', 'カンチャン'], meaning: '13で間の2を待つような形', tiles: '13m', category: '待ち', article: '/learn/waits' },
  { id: 'penchan', word: '辺張', reading: 'ペンチャン', aliases: ['辺張待ち', 'ペンチャン'], meaning: '12で3、89で7を待つ形', tiles: '12m', category: '待ち', article: '/learn/waits' },
  { id: 'shanpon', word: '双碰', reading: 'シャンポン', aliases: ['シャンポン', 'シャンポン待ち'], meaning: '対子2組のどちらかが刻子になるのを待つ形', tiles: '55m77p', category: '待ち', article: '/learn/waits' },
  { id: 'tanki', word: '単騎', reading: 'タンキ', aliases: ['単騎待ち'], meaning: '1枚だけの牌の相方を待って雀頭にする形', tiles: '5z', category: '待ち', article: '/learn/waits' },
  { id: 'nobetan', word: 'ノベタン', reading: 'ノベタン', meaning: '1234で1と4を待つような単騎の形', tiles: '1234m', category: '待ち', article: '/learn/waits' },
  { id: 'tamenchan', word: '多面張', reading: 'タメンチャン', aliases: ['多面待ち'], meaning: '3種類以上の牌を待つ形', tiles: '34567p', category: '待ち', article: '/learn/waits' },
  { id: 'keishiki-tenpai', word: '形式テンパイ', reading: 'ケイシキテンパイ', meaning: '役がなくても形がテンパイなら、流局時はテンパイ扱い', category: '待ち' },

  // ---- 手役・鳴き ----
  { id: 'yaku', word: '役', reading: 'ヤク', aliases: ['手役'], meaning: 'アガるのに必要な条件。1つ以上ないとアガれない', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'menzen', word: '門前', reading: 'メンゼン', meaning: '一度も鳴いていない状態', category: '手役・鳴き' },
  { id: 'naki', word: '鳴き', reading: 'ナキ', aliases: ['鳴く'], meaning: 'ポン・チー・カンで、ほかの人の捨て牌をもらうこと', category: '手役・鳴き', article: '/learn/calls' },
  { id: 'fuuro', word: '副露', reading: 'フーロ', meaning: '鳴いて面子を表に出すこと。出した面子のこと', category: '手役・鳴き', article: '/learn/calls' },
  { id: 'pon', word: 'ポン', reading: 'ポン', meaning: 'ほかの人の捨て牌をもらって刻子を作る鳴き', tiles: '555p', category: '手役・鳴き', article: '/learn/calls' },
  { id: 'chi', word: 'チー', reading: 'チー', meaning: '上家の捨て牌をもらって順子を作る鳴き', tiles: '345s', category: '手役・鳴き', article: '/learn/calls' },
  { id: 'kan', word: 'カン', reading: 'カン', aliases: ['暗槓', '明槓', '加槓', '大明槓'], meaning: '同じ牌4枚をそろえること。新しいドラが増える', tiles: '7777z', category: '手役・鳴き' },
  { id: 'kuitan', word: '喰いタン', reading: 'クイタン', meaning: '鳴いてタンヤオでアガること。Mリーグではあり', category: '手役・鳴き' },
  { id: 'atozuke', word: '後付け', reading: 'アトヅケ', meaning: '鳴いたあとに役をつけること。Mリーグではあり', category: '手役・鳴き' },
  { id: 'kuikae', word: '喰い替え', reading: 'クイカエ', meaning: '鳴いた牌と同じ牌かスジの牌をすぐ切ること。禁止', category: '手役・鳴き' },
  { id: 'kuisagari', word: '食い下がり', reading: 'クイサガリ', meaning: '鳴くと翻数が1つ下がる役のしくみ', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'riichi', word: 'リーチ', reading: 'リーチ', aliases: ['立直'], meaning: '門前でテンパイを宣言する1翻の役。1,000点を出す', category: '手役・鳴き', article: '/learn/riichi' },
  { id: 'dama', word: 'ダマ', reading: 'ダマ', aliases: ['ダマテン', '黙聴'], meaning: 'リーチをせずに、黙ってテンパイしていること', category: '手役・鳴き', article: '/learn/riichi' },
  { id: 'ippatsu', word: '一発', reading: 'イッパツ', meaning: 'リーチ後1巡以内に鳴きなしでアガるとつく1翻', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'tanyao', word: 'タンヤオ', reading: 'タンヤオ', aliases: ['断么九'], meaning: '2〜8の数牌だけで作る1翻の役', tiles: '234m567p', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'pinfu', word: 'ピンフ', reading: 'ピンフ', aliases: ['平和'], meaning: '門前で面子が全部順子、両面待ちの1翻の役', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'yakuhai', word: '役牌', reading: 'ヤクハイ', meaning: '白・發・中・自風・場風。3枚そろえると1翻', tiles: '555z', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'jikaze', word: '自風', reading: 'ジカゼ', aliases: ['自風牌'], meaning: '自分の席の風。親(東家)なら東', category: '手役・鳴き' },
  { id: 'bakaze', word: '場風', reading: 'バカゼ', aliases: ['場風牌'], meaning: '東場なら東、南場なら南', category: '手役・鳴き' },
  { id: 'otakaze', word: 'オタ風', reading: 'オタカゼ', meaning: '自風でも場風でもない風牌。3枚でも役にならない', category: '手役・鳴き' },
  { id: 'chiitoitsu', word: '七対子', reading: 'チートイツ', aliases: ['チートイ'], meaning: '対子7組で作る2翻の役', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'honitsu', word: '混一色', reading: 'ホンイツ', aliases: ['ホンイツ'], meaning: '1色の数牌と字牌だけで作る役(門前3翻)', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'chinitsu', word: '清一色', reading: 'チンイツ', aliases: ['チンイツ'], meaning: '1色の数牌だけで作る役(門前6翻)', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'toitoi', word: '対々和', reading: 'トイトイホー', aliases: ['トイトイ'], meaning: '刻子4組と雀頭で作る2翻の役', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'yakuman', word: '役満', reading: 'ヤクマン', meaning: '一番高い役。子32,000点・親48,000点', category: '手役・鳴き', article: '/learn/yaku' },
  { id: 'dora', word: 'ドラ', reading: 'ドラ', meaning: '1枚持つごとに1翻増える牌。役ではない', category: '手役・鳴き' },
  { id: 'dora-hyoujihai', word: 'ドラ表示牌', reading: 'ドラヒョウジハイ', meaning: '王牌でめくる牌。その次の牌がドラになる', category: '手役・鳴き' },
  { id: 'uradora', word: '裏ドラ', reading: 'ウラドラ', meaning: 'リーチしてアガった人だけが使えるドラ', category: '手役・鳴き' },
  { id: 'akadora', word: '赤ドラ', reading: 'アカドラ', aliases: ['赤五', '赤5'], meaning: '赤い5。各色1枚あり、1枚で1翻増える', tiles: '0m0p0s', category: '手役・鳴き' },
  { id: 'pao', word: 'パオ', reading: 'パオ', aliases: ['責任払い'], meaning: '役満を確定させる鳴きをさせた人が点数を払うルール', category: '手役・鳴き', article: '/learn/mleague-rules' },

  // ---- 守備 ----
  { id: 'houjuu', word: '放銃', reading: 'ホウジュウ', aliases: ['振り込み'], meaning: '自分が捨てた牌でロンされること', category: '守備' },
  { id: 'furiten', word: 'フリテン', reading: 'フリテン', meaning: '待ち牌を自分で捨てていて、ロンできない状態', category: '守備', article: '/learn/furiten' },
  { id: 'anpai', word: '安パイ', reading: 'アンパイ', aliases: ['安全牌'], meaning: '当たらない、または当たりにくい牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'genbutsu', word: '現物', reading: 'ゲンブツ', meaning: 'リーチした人の河にある、その人に絶対当たらない牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'suji', word: 'スジ', reading: 'スジ', meaning: '4なら1と7のように3つ離れた牌。両面待ちに当たらない', tiles: '147m', category: '守備', article: '/learn/safe-tiles' },
  { id: 'ryousuji', word: '両スジ', reading: 'リョウスジ', meaning: '4・5・6で、両側のスジが両方通っている牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'katasuji', word: '片スジ', reading: 'カタスジ', meaning: '4・5・6で、片側のスジだけ通っている牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'musuji', word: '無スジ', reading: 'ムスジ', meaning: 'スジにも壁にもならない、危ない数牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'kabe', word: '壁', reading: 'カベ', meaning: '同じ牌が4枚見えていて、それを使う両面待ちがない状態', category: '守備', article: '/learn/safe-tiles' },
  { id: 'no-chance', word: 'ノーチャンス', reading: 'ノーチャンス', meaning: '壁があり、両面待ちで当たる形が残っていない牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'one-chance', word: 'ワンチャンス', reading: 'ワンチャンス', meaning: '両面待ちに必要な牌が、残り1枚しかない牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'hikkake', word: '引っかけ', reading: 'ヒッカケ', meaning: 'スジの牌でわざと待つこと。スジでも当たることがある', category: '守備', article: '/learn/safe-tiles' },
  { id: 'sengenhai', word: '宣言牌', reading: 'センゲンハイ', meaning: 'リーチするときに横向きにして切った牌', category: '守備', article: '/learn/safe-tiles' },
  { id: 'betaori', word: 'ベタオリ', reading: 'ベタオリ', aliases: ['降り', 'オリ'], meaning: '安全な牌だけを切って、アガリをあきらめること', category: '守備', article: '/learn/betaori' },
  { id: 'oshihiki', word: '押し引き', reading: 'オシヒキ', aliases: ['押し'], meaning: '危険な牌を切って勝負するか、降りるかの判断', category: '守備', article: '/learn/pushfold' },
  { id: 'atamahane', word: '頭ハネ', reading: 'アタマハネ', meaning: '2人が同時にロンしたとき、放銃者の下家に近い1人だけがアガること', category: '守備', article: '/learn/mleague-rules' },

  // ---- 点数 ----
  { id: 'han', word: '翻', reading: 'ハン', meaning: '役とドラの数。1つ増えると点数がおよそ2倍になる', category: '点数', article: '/learn/score-basics' },
  { id: 'fu', word: '符', reading: 'フ', meaning: '手の形とアガリ方で決まる点。翻と合わせて点数を出す', category: '点数', article: '/learn/fu' },
  { id: 'fuutei', word: '副底', reading: 'フーテイ', meaning: '符計算で、どの手にも最初につく20符', category: '点数', article: '/learn/fu' },
  { id: 'kihonten', word: '基本点', reading: 'キホンテン', meaning: '符×2の(翻+2)乗。点数を出すもとになる数', category: '点数', article: '/learn/score-basics' },
  { id: 'mangan', word: '満貫', reading: 'マンガン', meaning: '5翻の点数。子8,000点・親12,000点', category: '点数', article: '/learn/score-basics' },
  { id: 'kiriage-mangan', word: '切り上げ満貫', reading: 'キリアゲマンガン', meaning: '30符4翻・60符3翻を満貫として数えること', category: '点数', article: '/learn/score-basics' },
  { id: 'haneman', word: '跳満', reading: 'ハネマン', meaning: '6〜7翻の点数。子12,000点・親18,000点', category: '点数', article: '/learn/score-basics' },
  { id: 'baiman', word: '倍満', reading: 'バイマン', meaning: '8〜10翻の点数。子16,000点・親24,000点', category: '点数', article: '/learn/score-basics' },
  { id: 'sanbaiman', word: '三倍満', reading: 'サンバイマン', meaning: '11翻以上の点数。子24,000点・親36,000点', category: '点数', article: '/learn/score-basics' },
  { id: 'honba', word: '本場', reading: 'ホンバ', aliases: ['積み棒'], meaning: '連荘や流局で積む棒。アガると1本300点多くもらえる', category: '点数' },
  { id: 'kyoutaku', word: '供託', reading: 'キョウタク', aliases: ['リーチ棒'], meaning: '場に出ているリーチ棒。次にアガった人がもらう', category: '点数' },
  { id: 'noten-bappu', word: 'ノーテン罰符', reading: 'ノーテンバップ', meaning: '流局時、ノーテンの人がテンパイの人に払う合計3,000点', category: '点数' },
  { id: 'juniten', word: '順位点', reading: 'ジュンイテン', aliases: ['ウマ'], meaning: '順位でもらうポイント。+50/+10/−10/−30', category: '点数', article: '/learn/mleague-rules' },
]

/** 用語集の該当箇所の URL */
export const termHref = (term: Term) => `/learn/glossary#${term.id}`

/** 用語を id・用語・別名から探す */
export function findTerm(key: string): Term | undefined {
  return TERMS.find((t) => t.id === key || t.word === key || t.aliases?.includes(key))
}

/** 50音の行(読みの最初の文字から) */
export const KANA_ROWS = ['ア', 'カ', 'サ', 'タ', 'ナ', 'ハ', 'マ', 'ヤ', 'ラ', 'ワ'] as const

const ROW_START = 'アカサタナハマヤラワ'
const toSeion = (c: string) => {
  // 濁音・半濁音・小書きを清音にする(ガ→カ、パ→ハ、ャ→ヤ)
  const n = c.normalize('NFD')[0]
  const small: Record<string, string> = { ァ: 'ア', ィ: 'イ', ゥ: 'ウ', ェ: 'エ', ォ: 'オ', ャ: 'ヤ', ュ: 'ユ', ョ: 'ヨ', ッ: 'ツ' }
  return small[n] ?? n
}

/** 読みが50音のどの行か */
export function kanaRow(reading: string): (typeof KANA_ROWS)[number] {
  const c = toSeion(reading[0]).charCodeAt(0)
  let row = 0
  for (let i = 0; i < ROW_START.length; i++) if (c >= ROW_START.charCodeAt(i)) row = i
  return KANA_ROWS[row]
}

/** 読みの50音順に並べる */
export function sortByReading(terms: readonly Term[]): Term[] {
  return [...terms].sort((a, b) => a.reading.localeCompare(b.reading, 'ja'))
}

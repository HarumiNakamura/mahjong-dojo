# 麻雀道場(仮) 開発ガイド

## サイトの方針

- **対象**: 麻雀を覚えたばかりの初心者。UI と解説はすべて日本語。
- **学べる内容**: 牌効率・待ち・安パイ・押し引き・点数計算・配牌方針を 1 サイトで学べる。
- **学習体験**: 「解説を読む → すぐ手を動かす → なぜ正解かが画面で見える」を重視する。
- **ログイン機能なし**: 学習記録はブラウザ(localStorage)に保存し、書き出し/読み込み(エクスポート/インポート)できるようにする。
- **生成AIの API は使わない**: 正解判定と解説文はすべてプログラムで生成する。
- **静的サイト**: サーバー処理なし。計算はすべてブラウザ内で行う。
- **ロジックの分離**: 麻雀ロジックは `src/engine/` に置き、画面(React)から独立させる。engine には必ずテストを書く。
  - engine から React や DOM、localStorage を参照しない(純粋な TypeScript の関数にする)。
- **スマホ縦画面優先**: まずスマホ縦画面で使いやすいことを優先し、PC は後から対応する。
- **広告枠**: 将来 Google AdSense の広告を置く。広告枠は操作の邪魔にならない配置にする(問題・牌・ボタンの近くに置かない、誤タップを誘わない)。

## 麻雀ルール(Mリーグ公式ルール準拠)

詳細は `docs/rules.md` に記載し、エンジンのルール設定は `src/engine/rules.ts` の1か所にまとめる。

- 四人麻雀、東南戦(半荘)。西入なし
- 赤ドラ:5萬・5筒・5索 各1枚
- 一翻縛り。喰いタンあり、後付けあり。喰い替えは禁止
- ドラ:表ドラ・裏ドラ(リーチ者のみ)・カンドラ(カン成立時に即めくる)・カン裏・赤ドラ。ドラは役ではない
- 一発あり、ダブルリーチあり
- リーチ:フリテンリーチ可、ツモ番のないリーチ可(海底をツモった人は不可)。リーチ後の暗槓は面子構成が変わらなければ可
- フリテン:捨て牌に当たり牌があればロン不可(ツモのみ)。同巡内フリテン、リーチ後の見逃しによるフリテンあり
- 途中流局なし(九種九牌・四風連打・四家立直・四槓散了などはすべてなし)
- ダブロンなし(頭ハネ:放銃者の下家→対面→上家の順で優先)
- 流局時:ノーテン罰符は場に3,000点。形式テンパイ可(役なしでも可)。ただし当たり牌を自分の手牌・副露ですべて使っている場合はノーテン
- 連荘:親のアガリまたは親の聴牌で連荘、親ノーテンで親流れ。アガリやめの規定なし
- 積み棒:1本場300点。親ノーテン流局でも積む。子のアガリで消滅
- リーチ棒:次のアガリ者が取得。南4局が流局したらトップが取得(トップが同点なら按分し、端数は起家に近い人へ)
- トビなし(持ち点がマイナスでも南4局まで続行)
- 25,000点持ち・30,000点返し。順位点 1位+50,000/2位+10,000/3位−10,000/4位−30,000(1,000点=1pt)。同点は順位点を等分(端数は起家に近い人が多く受け取る)
- 符:副底20符、門前ロン+10符、ツモ+2符(ピンフツモは20符)、辺張・嵌張・単騎+2符。役牌の雀頭は2符(連風牌の雀頭も2符)。鳴いたピンフ形のロンは30符。七対子は25符2翻
- 切り上げ満貫あり(30符4翻・60符3翻は満貫)
- 満貫5翻、跳満6〜7翻、倍満8〜10翻、三倍満11翻以上。数え役満なし
- 役満:天和・地和・国士無双・四暗刻・大三元・緑一色(發なしでも可)・字一色・小四喜・大四喜・清老頭・四槓子・九蓮宝燈。異なる役満の複合はあり。四暗刻単騎などを別扱いするダブル役満はなし(公式の役一覧に別枠がないため)
- 人和・流し満貫はなし(公式の役一覧にないため)
- パオ:大三元・大四喜を確定させるポン/大明槓をさせた人、四槓子の4つ目を大明槓させた人が対象。ツモは全額、ロンは放銃者と折半。積み棒は鳴かせた人が負担。役満が複合した場合、責任払いは確定させた役満の分だけ
- 暗槓に対する搶槓(国士無双を含む)は不可

## 技術構成

- Vite + React + TypeScript
- テスト: Vitest(`src/**/*.test.ts(x)`)
- 公開: Cloudflare Workers の静的アセット(`wrangler.jsonc`、`dist/` を配信)。`main` へのマージで Workers Builds が自動公開する(手順は `docs/deploy.md`)

## ディレクトリ

- `src/engine/` … 麻雀ロジック(画面から独立、テスト必須)
- `src/engine/rules.ts` … ルール設定(採用ルールの値はここだけに書く)
- `docs/rules.md` … ルールの詳細説明
- `src/engine/tiles.ts` … 牌の表現(34種+赤5、文字列表記の読み書き、枚数配列、理牌)
- `src/engine/shanten.ts` … シャンテン数(通常手・七対子・国士無双と最小値。副露は手牌の枚数から判断)
- `src/engine/ukeire.ts` … 受け入れ枚数(打牌候補ごとのシャンテン数・有効牌・残り枚数、待ち牌)
- `src/engine/random.ts`・`wall.ts` … シード付き乱数と山(136枚・赤5入り)
- `src/engine/efficiency.ts` … 何切るの正解判定(基本はシャンテン数 → 受け入れ枚数。保つ打牌の受け入れが極端に少ないときだけシャンテン戻しを正解にする。同じ枚数ならどれも正解)
- `src/engine/efficiencyQuestion.ts` … 何切るの問題作り(山から配牌し、簡易プレイヤーで数巡進めた局面を難易度で切り出す)
- `src/engine/efficiencyExplain.ts` … 何切るの解説文(テンプレート。何切る・一人麻雀・CPU対戦の振り返りで共通)。手牌を渡すと、切った牌・最善の牌の役割(`tileRole.ts`:孤立牌・嵌張・辺張・両面・対子・面子)と、減った・増えた有効牌、シャンテン戻しの説明、関連記事を出す
- `src/components/tile/` … 牌の SVG 絵柄と部品(Tile・Hand・Discards)。牌の画像は既存の画像を使わず SVG で自作する
  - 手牌から1枚選ぶ画面は `Hand` の `onPick` を使う(2段階タップ:選ぶ → もう一度タップか決定ボタン。「1回のタップで決定」の設定つき)。手牌は画面幅いっぱいに大きく並べ、押せる範囲は高さ44px以上(測定結果は `docs/ui-check.md`)
  - 牌の文字は端末のフォントに頼らず、SIL OFL のフォント(npm の @fontsource)から必要な文字だけを SVG のパスに変換して使う(`npm run build:glyphs` → `glyphs.generated.ts`)
  - 使ったフォントとライセンスは `docs/licenses.md` に記録する
- `src/app/` … ページ構成(`routes.ts`)と画面切り替え(`router.ts`・`Link.tsx`。ライブラリは使わない)
- `src/components/layout/` … サイト共通の枠(ヘッダー・メニュー・広告枠・フッター)。広告枠(`AdSlot`)は本文の下にだけ置き、問題・牌・ボタンの近くには置かない
- `src/components/drill/` … ドリル共通部品(問題 → 回答 → 正誤 → 解説 → 次の問題)。各ドリルはこれを使う
- `src/engine/scoring.ts` … 役・符・点数の計算(手牌の分け方をすべて調べ、最も高い点数を選ぶ。パオは含まない)。テストケースは `scoring.cases.ts`、一覧は `npm run report:scoring` で `docs/scoring-tests.md` に書き出す
- `src/engine/scoreTable.ts` … 点数早見表のデータ(符×翻・親子・ロン/ツモ、満貫以上。ありえない組み合わせは空欄)
- `src/engine/scoreQuestion.ts` … 点数計算ドリルの問題作り(実戦に近い比率でアガリ形と状況を作る)と段階ごとの判定
- `src/engine/waits.ts` … 待ちの判定(待ち牌・手牌の分け方・待ちの形。自分で4枚使っている当たり牌は除く。形式聴牌の判定にも使う)
- `src/engine/waitsQuestion.ts` … 待ち当ての問題作り(1色の4・7・10・13枚形)と判定
- `src/engine/danger.ts` … 守備の判定(他家リーチの局面作り、牌ごとの根拠:現物・字牌・スジ・両スジ・宣言牌のスジ・壁/ノーチャンス・ワンチャンス・片スジ・無スジと危険度。複数リーチはまとめる)。危険度の数値は `src/data/danger-table.ts`、考え方は `docs/defense.md`
- `src/engine/safetyQuestion.ts` … 安パイ並べの問題作り(初級=現物あり・中級=スジ/壁・上級=リーチ2人)と判定(並べ替えは危険度のグループ順。同じ危険度の中の順番は問わない。かんたんモードは一番安全な1枚)
- `src/engine/betaori.ts`・`betaoriQuestion.ts` … ベタオリサバイバル(リーチ後、流局まで1巡ずつ切る。放銃で即終了。他家は乱数なしの簡易プレイヤーなので、シードと打牌の並びから再現できる)と振り返り(毎巡の危険度と最善、現物の残り方)。ドリルとしては放銃せずに終われたら正解
- `src/engine/pushfold.ts` … 押し引きの概算(押しの期待値=アガリ率×打点−放銃率×相手の打点−相手ツモの支払い、降りの期待値=−相手ツモの支払い。差が小さければどちらも正解)。数値は `src/data/pushfold-table.ts`、考え方は `docs/pushfold.md`
- `src/engine/pushfoldQuestion.ts` … 押し引きジャッジの問題作り(テンパイ/イーシャンテンで、形を保つには危険牌を切るしかない局面)
- `src/engine/plan.ts`・`planQuestion.ts` … 配牌方針の採点(門前リーチ・タンヤオ・役牌・染め手・七対子・守備寄りを、シャンテン数・役牌の対子・ドラ・色の偏り・么九牌・対子の数から0〜100点で採点。最高点から10点以内はすべて正解)。問題はシードで決まり、一人麻雀と同じ山なので `/practice/solo?seed=…&plan=…` で続きを打てる
- `src/engine/call.ts`・`callQuestion.ts` … 鳴き判断(ポン・チー・スルー)。鳴いたあとの役(役牌・断么九・混一色/清一色)、シャンテン数が進むか、翻数の変化、巡目で判断。役がない鳴き・進まない鳴きは不正解。喰い替え(現物・スジ)の打牌は選べない
- `src/engine/progress.ts` … 学習の進み具合(ロードマップ:役・待ち→牌効率→守備→押し引き・鳴き・配牌方針、分野ごとの正解率=弱点マップ、次のおすすめ、連続日数、今日の練習の5問の選び方)。すべて学習記録から計算し、記録0件でも動く
- `src/engine/solo.ts` … 一人麻雀(鳴きなし・リーチとツモアガリあり・18巡)の進行と振り返り(毎巡の打牌と最善手、受け入れの差、テンパイ巡目)。採点は牌効率だけで役や打点は見ない
- `src/engine/records.ts` … 学習記録のデータ操作(回答の追加・集計・推移・間違えた問題・お気に入り・CPU対戦の成績・書き出しと読み込み)
- `src/app/records/` … 学習記録の保存先(localStorage)。使えない環境ではメモリだけで動き、画面に注意を出す(サイトは壊さない)
- `src/drills/` … ドリルの定義(`DrillDefinition`)と一覧(`registry.ts`)。新しいドリルは定義を作って登録すると、学習記録・解き直し・お気に入りにつながる
- `src/drills/daily.ts`・`src/pages/TodayPage.tsx` … 今日の練習(`/today`。日付で決まる5問を、いろいろなドリルから1問ずつ)
- `src/pages/home/` … ホーム:「1問だけ何切る」(`HomeQuiz`。日付で決まる初級の1問)・初めての人向けの3ステップ(`FirstSteps`。記録がないときは今日の練習・弱点マップの代わりに出す)・双六のようなロードマップ(`RoadmapPath`)・弱点マップ・今日の練習
- `src/app/share.ts`・`src/components/drill/ShareButton.tsx`・`src/pages/SharedQuestionPage.tsx` … 問題の共有(`/q/<ドリル>?d=<問題データ>`。問題データは JSON を base64url にしたもの。URL のコピーと X への投稿)
- `src/app/ogp.ts`・`public/og/` … OGP 画像(ドリルごとに固定、1200×630)。`npm run build` のあと `npm run build:og` で `/dev/og/<id>` を撮影して作る
- `src/config/site.ts` … サイト名・「(仮)」の有無・公開 URL・説明文(環境変数 `VITE_SITE_NAME`・`VITE_SITE_PROVISIONAL`・`VITE_SITE_URL` で上書き)。**サイト名と URL は必ずここから取る**(直書きしない)。独自ドメインへの移行は `docs/domain-migration.md`
- `src/app/seo.ts`・`src/entry-server.tsx`・`scripts/prerender.mjs` … 検索対策。記事は検索向けの題名(先頭の `seoTitle`。一覧は `docs/seo-titles.md`)・パンくずと記事の構造化データ(JSON-LD)・記事ごとの OGP 画像(`scripts/article-og.mjs` がビルド時に `dist/og/articles/<記事>.png` を作る)。ホームは本文まで HTML にして引き継ぐ(学習記録で変わる部分と「1問だけ何切る」は、画面ができてから出す)。本文を HTML にできない練習の入口・CPU対戦などは、紹介(`src/shell/PageShell.tsx`)を HTML に入れ、ブラウザで置きかえる。ページごとの題名・説明・OGP・X カードと、ビルド時に作る HTML(`dist/<パス>.html`、記事などは本文まで)・`404.html`・`sitemap.xml`・`robots.txt`。新しいページを足したら `seo.ts` にも追加する(計測結果は `docs/performance.md`)
- `src/pages/site/`・`src/app/siteInfo.ts` … プライバシーポリシー(`/privacy`)・運営者情報とお問い合わせ(`/contact`)・免責事項(`/disclaimer`)。運営者名・お問い合わせフォーム(Google フォーム)・Google 広告設定の URL は `siteInfo.ts` に書く(空なら「準備中」と表示)。フッターにはすべてのページへのリンクを並べる
- `src/game/` … CPU対戦(`/play`。メニュー・ホームのロードマップ・サイトマップに載せる)。対局の進行と CPU は `@kobalab/majiang-core`・`@kobalab/majiang-ai`(MIT。型定義は `src/types/majiang.d.ts`)
  - `rule.ts` … ライブラリのルールを Mリーグに合わせた設定と補正(海底をツモった人のリーチ不可・四槓子のパオ・パオのロンの積み棒・副露も含めた4枚使いのノーテン。点数は `pao.ts`)。再現できない項目は `docs/game-rules-gap.md`
  - `result.ts` … 半荘の最終成績(順位点・同点の等分・南4局流局時の供託)を自前で計算
  - `convert.ts` … サイトの牌とライブラリの表記の変換。`selfplay.ts` … CPU 同士の自動対局と成績の集計
  - `scoringCrosscheck.ts` … 自前の点数計算とライブラリの点数の突き合わせ
  - `difficulty.ts` … 難易度(やさしい=`easyPlayer.ts` の受け入れ最大・守備と鳴きとリーチなし、ふつう=majiang-ai legacy 0201、つよい=最新版)。強さの差は `docs/cpu-stats.md`。古い版は `legacy()` がブラウザで動かないので、`vite.config.ts` の別名(`majiang-ai-legacy-0201`)でファイルを直接読み込む
  - `hints.ts` … 練習モードのヒント(切る牌ごとの受け入れ枚数・リーチ者に対する危険度)。練習モードの成績は `practice` で分けて集計する
  - `humanPlayer.ts` … 対局の「自分」。ライブラリからの知らせに対してできる操作(打牌・リーチ・ツモ・カン・ロン・チー・ポン)を計算し、画面の操作を待つ。喰い替え・フリテン・役なしの判定はライブラリに任せる
  - `session.ts` … 自分 + CPU 3人の半荘を進める(CPU の速さの設定、鳴き・リーチの声の表示、局の始まりの途中保存と続きから、終局の知らせ)
  - `save.ts` … 途中保存の形の確認と表示。保存先は `src/app/playSave.ts`(localStorage。局が始まるたびに保存し、終局で消す)
  - `huleDetail.ts` … アガリを自前の点数計算で計算し直し、役・符の内訳を出す(局の結果画面用)
  - `replay.ts` … 牌譜の再生(局・手数から盤面を作る、手の説明、場面の URL `/play/replay?g=<対局>&k=<局>&s=<手数>&v=all`)
  - `paipuRecords.ts` … 牌譜の保存データ(直近20半荘)の確認と合わせ方。保存先は `src/app/paipuStore.ts`(localStorage)。学習記録の書き出し/読み込みに牌譜も入る
  - `gameRecord.ts` … 半荘の牌譜から自分の成績(順位・ポイント・アガリ・放銃など)を作り、学習記録の `games` に保存する
- `src/review/` … CPU対戦の振り返り(画面から独立、テスト必須)。`reviewGame.ts` が牌譜を1手ずつ再現し、`checks.ts` が分類ごとに判定(打牌の牌効率・押し引き・より安全な牌があった放銃・鳴き・アガリ逃し・役なしダマ)。損失の目安(点)とテンプレートの理由をつけ、分かれ目(上位3つ)を選ぶ。しきい値は `thresholds.ts`、考え方は `docs/review.md`。テスト用の短い牌譜は `fixtures.ts`。画面からは `src/app/runReview.ts`(Web Worker)で呼ぶ
- `src/pages/play/PlayStatsPage.tsx` … CPU対戦の通算成績(`/play/stats`。難易度ごと・練習モードは別)
- `src/pages/play/GameReviewPage.tsx` … CPU対戦の振り返り(`/play/review?g=<対局>`。半荘の結果から開く)。一言まとめ・分かれ目(最大3つ。牌譜の場面へ)・「この判断を後で見る」の場面・分類ごとの指摘・今回とこれまでの率・関連する練習と記事(`reviewLinks.ts`)。判定は目安であることを明記。初めて開いたときに、まとめを対局成績に、分かれ目を学習記録の復習リスト(`bookmarks`)に保存し、打牌の分かれ目は何切るのお気に入りにも入れる(`src/review/efficiencyQuestionAt.ts`)。振り返りの指摘は弱点マップ・おすすめにも使う(`progress.ts` の `gameAreaStats`)
- `src/pages/play/ReplayPage.tsx` … 牌譜の再生(`/play/replay`。一覧・局の選択・1手ずつ進む/戻る・次の自分の番・自分視点/全員の手牌・場面の URL のコピー)。盤面の部品は `BoardParts.tsx` を対局画面と共用
- `src/pages/PlayPage.tsx`・`src/pages/play/` … CPU対戦の対局画面(`/play`。スマホ縦優先:上に点数・場・ドラ・残り枚数、中央に河(拡大できる)、下に自分の手牌と操作ボタン)と局の結果(役・符の内訳・点数の動き、流局はテンパイ/ノーテンと罰符)・半荘の結果(順位・持ち点・順位点込みのポイント)。対局をやめる/最初からやり直すは確認つき。広告枠は出さない
- `src/pages/records/` … 学習記録ページ(`/records`)と解き直し(`/records/review/<ドリル>/<mistakes|favorites>`)
- `src/pages/score/` … 点数計算ドリル(`/practice/score`)と点数早見表(`/score-table`)の表示・解説
- `src/pages/waits/` … 待ち当てドリル(`/practice/waits`)の問題表示・色分けの解説・タイムアタック
- `src/pages/solo/` … 一人麻雀(`/practice/solo`)の対局画面と振り返り。振り返りの局面は何切るのお気に入り(復習リスト)に追加できる
- `src/pages/defense/` … 守備の練習(`/practice/defense`):安パイ並べとベタオリサバイバル。安パイ並べは並べ替え(押したまま動かす/タップで選んで置く)、河の根拠の強調、スジ表(現物からスジへの線・壁)、リーチ者の手牌公開
- `src/pages/judgment/` … 判断の練習(`/practice/judgment` に一覧)。押し引きジャッジ(`/practice/judgment/pushfold`)・配牌方針クイズ(`/practice/judgment/plan`)・鳴き判断クイズ(`/practice/judgment/call`)
- `src/pages/efficiency/` … 何切るドリル(`/practice/efficiency`)の問題表示と解説
- `src/pages/` … 各ページ(`/dev/tiles` は牌の表示確認用、`/dev/drill` はドリル部品の確認用)。まだないページは準備中と表示する
- `src/content/` … 解説記事。`articles/*.md` に1記事1ファイルで書く(`markdown.ts` の小さな Markdown:見出し・段落・箇条書き・表・`>` 補足・`[[123m]]` 文中の牌・`@tiles` 手牌の図・`@figure` 図解・`@points` この記事でわかること・`@drill` ドリルの案内)。全記事の冒頭に「この記事でわかること」(3行)、最後に `## まとめ`(3〜5行)を置く。先頭の `---` に title・description・order・category・drills(記事の最後の「この記事のドリル」)・related(関連記事)。本文は1,500〜3,000文字(`articles.test.ts` で文字数・リンク・牌の表記を確認)
- `src/components/figures/`・`src/content/figures.ts` … 記事の図解(SVG 部品。牌は `TileArt`、色はデザイントークン。題名と代替テキストは `figures.ts`)。一覧は `docs/figures.md`
- `src/content/terms.ts` … 用語データ(用語・読み・別名・一言の意味・牌の例・記事・分類)。用語集(`/learn/glossary#<id>`。`glossary.md` の `@glossary` で全用語を表示)と用語部品(`src/components/term/Term.tsx`。点線の下線、タップで吹き出し、HTML では用語集へのリンク)の両方がここを使う。記事では `{{面子}}`・`{{表示|用語}}` と書く
- `src/pages/LearnPage.tsx`・`ArticlePage.tsx`・`src/components/article/` … 記事一覧(`/learn`)と記事ページ(`/learn/<ファイル名>`)
- `src/App.tsx` … ページの切り替え。ページは `lazy` で必要なときに読み込む(最初に読み込む JS を小さくする)
- `src/` … 画面(React コンポーネント)

## デザイン(A 道場)

- 方向性: 墨色の見出し帯(ヘッダー)と、中(チュン)の牌の朱色。見出しは明朝体で、道場の看板のような引きしまった印象(比べた3案の記録は `docs/theme-proposals.md`)
- 色は `src/index.css` の CSS 変数(デザイントークン)だけを使い、直接の色指定は避ける。ダークモードは OS の設定で自動切り替え
  - `--bg`・`--surface`・`--surface-2`(面)、`--text`・`--text-muted`(文字)、`--border`(線)
  - `--accent`(朱。ボタン・リンク・見出しの線)、`--accent-soft`(朱の薄い背景)、`--ink`・`--header-bg`(墨色)、`--scene`(牌を置く場面)
  - `--correct`・`--wrong`(正誤)、`--focus`(フォーカス)
  - 文字と背景のコントラストは WCAG AA 以上(`src/designTokens.test.ts` で確認。色を変えたらテストが通ることを確かめる)
- フォント: 本文は BIZ UDPゴシック(`--font-body`)、見出し(h1〜h3・ロゴ・カードの題名)はしっぽり明朝 B1 の太さ800(`--font-heading`)
  - サイトで使う文字だけの `@font-face` を `npm run build:fonts`(`scripts/build-font-css.mjs` → `src/fonts.generated.css`)で作る(`npm run build` でも作り直す)。はじめて開いたときは CSS を当てずにフォントのファイルだけを空いた時間に読み込み、2回目から CSS を当てる(`src/app/fonts.ts`。当てるとファイルが届くたびにページ全体の配置をやり直して重いため)
- 形: 角丸は `--radius`(4px)。ページの題名は左に朱の太線、記事の見出しは朱の下線。影はほとんど使わない
- 余白: 左右は `--gutter`(16px)。セクションの間は 32px 前後。本文は16px以上、押せるボタンは高さ48px前後にする
- アイコン: 練習メニュー・解説の一覧は `src/components/card/IconCard.tsx`(牌の絵のアイコン。`routes.ts` の `icon` に牌を書く)。初めての人に最初にやってほしいもの(何切る・基本の流れ)は `featured` で大きくする
- PC(1024px以上): 一覧・記事は本文を広く使う(`Layout` の `wide`)。練習メニューは3列、記事は目次を右に固定
- 4人の河は卓の形に固定する(対面が上・上家が左・下家が右・自分が下。`DefenseRivers`・CPU対戦とも同じ)

## 用語

- 記事やドリルで用語を使うときは用語部品を使う(記事は `{{用語}}`、画面は `<Term id="…">`)。記事では初めて出てくる箇所だけにし、漢字だけの用語には初出で読み仮名を付ける(例: `{{七対子}}(チートイツ)`)
- 新しい用語は `src/content/terms.ts` に追加する

## 牌の表記

engine では `"123m456p789s1122z"` 形式の文字列を使う(m=萬子, p=筒子, s=索子, z=字牌 1東2南3西4北5白6發7中)。赤五は `0` で表す(例: `0m`)。

## コマンド

- `npm run dev` … 開発サーバー
- `npm test` … テスト実行
- `npm run build` … 本番ビルド(型チェック込み。最後にページごとの HTML・サイトマップを作る)
- `npm run lint` … リント
- `npm run deploy` … ビルドして Cloudflare に公開
- `npm run build:og` … OGP 画像(`public/og/*.png`)を作り直す(先に `npm run build`)
- `npm run cpu:selfplay -- [半荘数] [CPU] [並列数]` … CPU 4人の自動対局を回して `docs/cpu-stats.md` に成績を書く(CPU は `easy`・`normal`・`strong` など。`strong,easy,easy,easy` のように4人分も指定できる。最新版 AI は1半荘約20秒。1,000半荘で約1.5時間)
- `npm run report:scoring` … 点数計算のテスト結果を `docs/scoring-tests.md` に書き出す(点数計算を変えたら実行する)

## 作業ルール

- 作業の最後に `npm test` と `npm run build` が通ることを確認する。
- 変更内容を初心者にもわかる日本語で要約する。
- 作業が終わったら、指定ブランチへのプッシュ・プルリクエスト作成・マージまで自動で行う(確認は不要)。
- ルールを変えるときは CLAUDE.md・`docs/rules.md`・`src/engine/rules.ts` の3か所をそろえて更新する。

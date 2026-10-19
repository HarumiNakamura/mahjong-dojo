# 使用している素材のライセンス

## 牌の文字に使っているフォント

牌の文字(萬子の漢数字と「萬」、東・南・西・北・發・中)は、次のフォントの太字(800)から必要な文字だけを SVG のパスに変換して使っています。
変換は `scripts/build-tile-glyphs.mjs`(`npm run build:glyphs`)で行い、結果を `src/components/tile/glyphs.generated.ts` に保存しています。
フォントファイルそのものはサイトに含めて配布していません。

| フォント | 取得元(npm) | 使用箇所 | 著作権表示 | ライセンス |
| --- | --- | --- | --- | --- |
| Shippori Mincho B1 | `@fontsource/shippori-mincho-b1`(太さ800) | 牌の文字すべて | Copyright 2021 The Shippori Mincho Project Authors (https://github.com/fontdasu/ShipporiMincho) | SIL Open Font License 1.1 |

- SIL Open Font License 1.1 の全文: https://openfontlicense.org/open-font-license-official-text/
- 商用利用が認められています。

## 変換に使っているツール

| ツール | 用途 | ライセンス |
| --- | --- | --- |
| opentype.js(`opentype.js`) | フォントから文字の形を読み取り、SVG のパスに変換する(開発時のみ使用) | MIT License |

## CPU対戦に使っているライブラリ

CPU対戦(`/play`)の対局の進行と CPU の思考には、次のライブラリを使っています(`src/game/`)。

| ライブラリ | 取得元(npm) | 使用箇所 | 著作権表示 | ライセンス |
| --- | --- | --- | --- | --- |
| 電脳麻将 基本ライブラリ | `@kobalab/majiang-core` 1.4.1 | 対局の進行・アガリ判定 | Copyright(C) 2021 Satoshi Kobayashi | MIT License |
| 電脳麻将 思考ルーチン | `@kobalab/majiang-ai` 1.3.0 | CPU の打牌・鳴き・リーチの判断 | Copyright(C) 2021 Satoshi Kobayashi | MIT License |

- リポジトリ: https://github.com/kobalab/majiang-core 、https://github.com/kobalab/majiang-ai
- MIT License の全文: https://github.com/kobalab/majiang-core/blob/master/LICENSE
- ルールは Mリーグ公式ルールに合わせて設定しています(`src/game/rule.ts`)。ライブラリで再現できない項目は `docs/game-rules-gap.md` にまとめています。

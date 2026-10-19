# 独自ドメインへの移行手順

今は `https://mahjong-dojo.printempslamer.workers.dev` で公開しています。独自ドメイン(例: `example.jp`)に移すときの手順です。
サイト名・公開 URL は `src/config/site.ts` の1か所で管理しているので、コードの書き換えは設定だけで済みます。

## 1. Cloudflare で独自ドメインをつなぐ

1. ドメインを Cloudflare に追加する(Cloudflare で買うか、ほかの会社で買ったドメインのネームサーバーを Cloudflare に変える)
2. Cloudflare のダッシュボード → Workers & Pages → `mahjong-dojo` → 設定 → 「ドメインとルート」→「追加」→「カスタムドメイン」で `example.jp`(と必要なら `www.example.jp`)を追加する
3. 数分で証明書(HTTPS)が発行される。`https://example.jp/` でサイトが開けることを確かめる

## 2. 公開 URL の設定を変える

Workers Builds の「設定 → ビルド → 変数とシークレット」に次を追加し、再ビルドする(または `src/config/site.ts` の既定値を書き換えてマージする)。

| 変数 | 値 |
| --- | --- |
| `VITE_SITE_URL` | `https://example.jp` |

これで canonical・sitemap.xml・robots.txt・OGP・構造化データの URL がすべて新しいドメインになる。
正式なサイト名が決まったら、同じ場所で `VITE_SITE_NAME`(名前)と `VITE_SITE_PROVISIONAL=false`(「(仮)」を外す)も設定する。

## 3. workers.dev から 301 リダイレクトする

同じ内容のサイトが2つの URL にあると、検索エンジンに重複と見なされることがあります。workers.dev への アクセスは独自ドメインへ 301(恒久的な移動)で転送します。

- いちばん簡単なのは、Workers の設定で workers.dev のルートを無効にすること(「ドメインとルート」→ workers.dev → 無効)。ただしこの場合は転送ではなく、古い URL が開けなくなる
- 検索の評価を引き継ぐには、`wrangler.jsonc` に Worker のスクリプトを足し、ホスト名が `*.workers.dev` のときに `https://example.jp` + 同じパスへ `Response.redirect(url, 301)` を返す(静的アセットの前に動かす `run_worker_first` を使う)
- 移したあと1年以上は、リダイレクトを残しておく

## 4. Search Console の手続き

1. Search Console に新しいドメインを「ドメイン」プロパティで追加し、DNS の TXT レコードで所有権を確認する
2. 古いプロパティ(workers.dev)の「設定 → アドレス変更」で、新しいドメインへの移転を申請する(3. の 301 リダイレクトが必要)
3. 新しいプロパティで `https://example.jp/sitemap.xml` を送信し直す
4. 数週間、「ページ」のレポートで新しい URL の登録が進んでいるか確かめる

## 5. そのほか

- AdSense: サイトの一覧に新しいドメインを追加し、`public/ads.txt` が新しいドメインで開けるか確かめる
- OGP 画像は記事ごとにビルド時に作り直されるので、作業は不要
- X などで共有された古い URL も、301 リダイレクトで新しい URL に届く

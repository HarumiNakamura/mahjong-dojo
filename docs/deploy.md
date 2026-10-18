# Cloudflare への公開手順

GitHub の `main` ブランチに変更が入るたびに、Cloudflare が自動でビルドして公開する仕組み(Workers Builds)を使います。
最初に一度だけ、Cloudflare の画面でリポジトリをつなぐ設定が必要です。

## 最初の1回だけやること

1. https://dash.cloudflare.com を開く(GitHub アカウントでログイン済みの状態)
2. 左のメニューから **Workers & Pages**(「コンピュート」の中にある場合もあります)を開く
3. **作成(Create)** を押し、**Workers** のタブで **リポジトリをインポート(Import a repository)** を選ぶ
4. **GitHub に接続** を押し、`HarumiNakamura/mahjong-dojo` へのアクセスを許可して、このリポジトリを選ぶ
5. 設定を次のとおりにする(多くは自動で入ります)

   | 項目 | 値 |
   | --- | --- |
   | プロジェクト名(Worker 名) | `mahjong-dojo`(`wrangler.jsonc` の `name` と同じにする。違うとビルドが失敗します) |
   | 本番ブランチ | `main` |
   | ビルドコマンド | `npm run build` |
   | デプロイコマンド | `npx wrangler deploy` |
   | ルートディレクトリ | `/`(空欄のままでよい) |

6. **作成して公開(Create and deploy)** を押す
7. ビルドが終わると、`https://mahjong-dojo.<あなたのサブドメイン>.workers.dev` で見られるようになります

## 2回目以降

`main` にマージするだけで、自動でビルドと公開が行われます。結果は Cloudflare の画面の、Worker の **デプロイ(Deployments)** で確認できます。

## うまくいかないとき

- **ビルドが失敗する**:Cloudflare の画面でビルドログを開き、エラー文を確認します。手元で `npm run build` が通るか確かめてください。
- **Worker 名が違うと言われる**:画面のプロジェクト名と `wrangler.jsonc` の `name` をそろえます。
- **Node.js のバージョン**:リポジトリの `.node-version` で Node.js 22 を指定しています。

## 手元から直接公開する場合(任意)

```bash
npx wrangler login   # ブラウザで Cloudflare にログイン
npm run deploy       # ビルドして公開
```

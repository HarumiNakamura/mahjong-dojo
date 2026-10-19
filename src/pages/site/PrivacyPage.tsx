import { Link } from '../../app/Link'
import { ABOUT_ADS_URL, SITE_INFO } from '../../app/siteInfo'
import '../pages.css'

/** プライバシーポリシー */
export function PrivacyPage() {
  return (
    <article className="prose">
      <h1 className="page-title">プライバシーポリシー</h1>
      <p>
        麻雀道場(仮)(以下「当サイト」)は、利用者の情報を次のとおり取り扱います。
      </p>

      <h2>学習記録の保存について</h2>
      <ul>
        <li>当サイトには登録やログインの機能はありません。名前やメールアドレスなどを入力していただくことはありません。</li>
        <li>
          学習記録(解いた問題・回答・正誤・日時・お気に入り)と表示の設定は、お使いのブラウザの中(localStorage)だけに保存されます。
        </li>
        <li>これらの記録は運営者のサーバーには送られず、運営者が見ることはできません。</li>
        <li>問題の正解判定や点数の計算は、すべてお使いのブラウザの中で行っています。</li>
        <li>
          記録は<Link to="/records">学習記録</Link>のページから書き出し(ファイルに保存)・読み込み・削除ができます。ブラウザのデータを消すと記録も消えます。
        </li>
      </ul>

      <h2>問題の共有について</h2>
      <p>
        「この問題を共有」で作る URL には、問題の内容(牌の並びなど)だけが入ります。学習記録や個人を特定する情報は入りません。
      </p>

      <h2>広告について</h2>
      <p>当サイトでは、第三者配信の広告サービス「Google アドセンス」を利用する予定です。</p>
      <ul>
        <li>
          Google などの第三者配信事業者は Cookie を使用して、利用者が当サイトや他のウェブサイトに過去にアクセスした際の情報に基づいて広告を配信します。
        </li>
        <li>
          Google が広告 Cookie を使用することにより、利用者が当サイトや他のサイトにアクセスした際の情報に基づいて、Google やそのパートナーが適切な広告を表示できます。
        </li>
        <li>
          利用者は、
          {SITE_INFO.googleAdSettingsUrl ? (
            <a href={SITE_INFO.googleAdSettingsUrl} target="_blank" rel="noopener noreferrer">
              Google の広告設定
            </a>
          ) : (
            <>Google の広告設定(リンク準備中)</>
          )}
          でパーソナライズ広告を無効にできます。
        </li>
        <li>
          また、
          <a href={ABOUT_ADS_URL} target="_blank" rel="noopener noreferrer">
            www.aboutads.info
          </a>
          にアクセスすると、パーソナライズ広告に使われる第三者配信事業者の Cookie を無効にできます。
        </li>
      </ul>

      <h2>アクセス解析について</h2>
      <p>現在、当サイトではアクセス解析ツールは使用していません。使用する場合は、このページでお知らせします。</p>

      <h2>お問い合わせ</h2>
      <p>
        このポリシーについてのお問い合わせは、<Link to="/contact">運営者情報・お問い合わせ</Link>のページからお願いします。
      </p>

      <h2>改定</h2>
      <p>このポリシーは、必要に応じて内容を見直し、このページで改定します。</p>
      <p className="prose-date">制定日:{SITE_INFO.policyDate}</p>
    </article>
  )
}

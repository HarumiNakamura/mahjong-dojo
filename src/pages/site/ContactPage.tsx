import { SITE_INFO } from '../../app/siteInfo'
import '../pages.css'

/** 運営者情報とお問い合わせ */
export function ContactPage() {
  return (
    <article className="prose">
      <h1 className="page-title">運営者情報・お問い合わせ</h1>

      <h2>運営者情報</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th scope="row">サイト名</th>
            <td>麻雀道場(仮)</td>
          </tr>
          <tr>
            <th scope="row">運営者</th>
            <td>{SITE_INFO.operatorName || '(準備中)'}</td>
          </tr>
          <tr>
            <th scope="row">内容</th>
            <td>麻雀初心者のための練習・解説サイト(Mリーグ公式ルール準拠)</td>
          </tr>
        </tbody>
      </table>

      <h2>お問い合わせ</h2>
      <p>サイトへのご意見・問題や解説の誤りのご指摘・その他のお問い合わせは、次のフォームからお送りください。</p>
      {SITE_INFO.contactFormUrl ? (
        <p>
          <a className="button button--primary" href={SITE_INFO.contactFormUrl} target="_blank" rel="noopener noreferrer">
            お問い合わせフォームを開く
          </a>
        </p>
      ) : (
        <p className="notice">お問い合わせフォームは準備中です。</p>
      )}
      <ul>
        <li>フォームは Google フォームを使っています。送っていただいた内容は、お返事とサイトの改善のためだけに使います。</li>
        <li>すべてのお問い合わせにお返事できるとは限りません。あらかじめご了承ください。</li>
        <li>問題の誤りをお知らせいただくときは、「この問題を共有」の URL を添えていただくと、同じ問題を確認できます。</li>
      </ul>
    </article>
  )
}

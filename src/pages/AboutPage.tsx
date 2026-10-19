import { Link } from '../app/Link'
import { SITE_NAME } from '../config/site'
import './pages.css'

export function AboutPage() {
  return (
    <article className="prose">
      <h1 className="page-title">このサイトについて</h1>
      <p>
        {SITE_NAME}は、麻雀を覚えたばかりの人が、牌効率・待ち・安パイ・押し引き・点数計算・配牌の方針を1つのサイトで学べるように作っている練習サイトです。
      </p>

      <h2>学び方</h2>
      <p>「解説を読む → すぐ手を動かす → なぜ正解なのかを画面で確かめる」の流れを大切にしています。</p>
      <p>
        問題の正解と解説は、すべてプログラムで計算して作っています。たとえば牌効率の問題では、切る牌ごとに「あと何枚でテンパイか」「引くと進む牌が何枚残っているか」を数えて比べます。
      </p>

      <h2>ルール</h2>
      <p>Mリーグ公式ルールに準拠しています。主なルールは次のとおりです。</p>
      <ul>
        <li>四人麻雀・東南戦(半荘)、25,000点持ち・30,000点返し</li>
        <li>赤ドラは5萬・5筒・5索が各1枚</li>
        <li>一翻縛り、喰いタンあり、後付けあり</li>
        <li>一発・裏ドラ・カンドラあり、途中流局なし、ダブロンなし(頭ハネ)</li>
        <li>切り上げ満貫あり、数え役満なし</li>
      </ul>

      <h2>できること</h2>
      <ul>
        <li>
          <Link to="/practice">練習</Link>:何切る(牌効率)・一人麻雀・待ち当て・点数計算・安パイ並べ・ベタオリサバイバル・押し引き・配牌方針・鳴き判断
        </li>
        <li>
          <Link to="/learn">解説</Link>:麻雀の基本から点数計算・守備・判断の考え方まで。記事の最後のドリルですぐ練習できます
        </li>
        <li>
          <Link to="/today">今日の練習</Link>:毎日入れ替わる5問。ホームでは学習ロードマップと弱点マップも見られます
        </li>
        <li>問題の共有:「この問題を共有」で、同じ問題を開ける URL を作れます</li>
      </ul>

      <h2>学習記録とプライバシー</h2>
      <ul>
        <li>登録やログインはありません。</li>
        <li>学習記録や設定は、お使いのブラウザの中(localStorage)だけに保存されます。運営者のサーバーには送られません。</li>
        <li>
          記録は<Link to="/records">学習記録</Link>のページから書き出して保存したり、別の端末で読み込んだりできます。
        </li>
        <li>計算はすべてブラウザの中で行います。</li>
      </ul>
      <p>
        くわしくは<Link to="/privacy">プライバシーポリシー</Link>をご覧ください。
      </p>

      <h2>判定の数値について</h2>
      <p>
        牌効率・待ち・点数は決まった手順で計算していますが、守備の危険度・押し引き・鳴き・配牌方針の判定は、統計をもとにした目安です。くわしくは
        <Link to="/disclaimer">免責事項</Link>をご覧ください。
      </p>

      <h2>広告について</h2>
      <p>
        サイトを続けるため、ページの下部に広告(Google アドセンス)を掲載する予定です。問題・牌・ボタンの近くには置かず、操作の邪魔にならない場所にします。
      </p>

      <h2>クレジット</h2>
      <ul>
        <li>
          牌の文字:Shippori Mincho B1(SIL Open Font License 1.1、Copyright 2021 The Shippori Mincho Project Authors)
        </li>
        <li>
          CPU対戦の対局の進行と CPU の思考:
          <a href="https://github.com/kobalab/majiang-core" target="_blank" rel="noopener noreferrer">
            電脳麻将 majiang-core
          </a>
          ・
          <a href="https://github.com/kobalab/majiang-ai" target="_blank" rel="noopener noreferrer">
            majiang-ai
          </a>
          (MIT License、Copyright(C) 2021 Satoshi Kobayashi)
        </li>
      </ul>

      <h2>お問い合わせ</h2>
      <p>
        ご意見や誤りのご指摘は、<Link to="/contact">運営者情報・お問い合わせ</Link>のページからお送りください。
      </p>
    </article>
  )
}

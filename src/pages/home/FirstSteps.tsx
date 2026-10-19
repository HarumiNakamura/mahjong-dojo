import { Link } from '../../app/Link'

const STEPS = [
  { title: '基本の流れを読む', text: '麻雀の1局の進み方と、アガリの形を知ります。', path: '/learn/flow', action: '記事を読む' },
  { title: '何切るを解く', text: '14枚から1枚切って、早くテンパイする打牌を選びます。', path: '/practice/efficiency', action: '何切るを解く' },
  { title: '待ちを当てる', text: 'テンパイした手が、どの牌でアガれるかを見つけます。', path: '/practice/waits', action: '待ちを当てる' },
]

/** 学習記録がない初めての人向けの「はじめての方へ:3ステップ」 */
export function FirstSteps() {
  return (
    <section className="home-section first-steps" aria-labelledby="first-steps-title">
      <h2 id="first-steps-title">はじめての方へ:3ステップ</h2>
      <ol className="first-steps-list">
        {STEPS.map((s, i) => (
          <li key={s.path} className="first-step">
            <span className="first-step-num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="first-step-body">
              <strong>{s.title}</strong>
              <span>{s.text}</span>
              <Link to={s.path}>{s.action} →</Link>
            </span>
          </li>
        ))}
      </ol>
      <p className="home-note">練習すると、今日の練習・弱点マップがここに出てきます。</p>
    </section>
  )
}

/**
 * 広告枠(今は場所だけ確保している)。
 * 問題・牌・操作ボタンの近くには置かない。ページ本文の下に、十分な間隔をあけて置く。
 */
export function AdSlot() {
  return (
    <aside className="ad-slot" aria-label="広告">
      <span className="ad-slot-label">広告</span>
    </aside>
  )
}

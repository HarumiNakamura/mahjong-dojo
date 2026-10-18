import { useRecords } from './useRecords'

/** 「記録はこの端末のブラウザに保存されます」の表示。保存できないときは注意を出す */
export function StorageNotice({ compact = false }: { compact?: boolean }) {
  const { persistent, saveFailed } = useRecords()
  if (!persistent) {
    return (
      <p className="storage-notice storage-notice--warn" role="status">
        このブラウザでは記録を保存できません(プライベートブラウズなど)。記録はページを閉じると消えます。
      </p>
    )
  }
  if (saveFailed) {
    return (
      <p className="storage-notice storage-notice--warn" role="status">
        記録を保存できませんでした(ブラウザの保存容量がいっぱいの可能性があります)。記録を書き出してから、古い記録を消してください。
      </p>
    )
  }
  return (
    <p className="storage-notice">
      記録はこの端末のブラウザに保存されます。{!compact && 'ほかの端末やブラウザとは共有されず、ブラウザのデータを消すと記録も消えます。'}
    </p>
  )
}

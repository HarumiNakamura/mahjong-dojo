// CPU 4人の半荘を自動で回し、エラーや無限ループがないことの確認と、成績の集計を行う
// 使い方: npm run cpu:selfplay -- [半荘数=1000] [CPU] [並列数=CPU のコア数]
//   CPU: latest(=strong)・easy・normal・0101 などの1つ(4人とも同じ)か、
//        「strong,easy,easy,easy」のように4人分をカンマで(P1〜P4)
// 結果は docs/cpu-stats.md に書き出す(同じ CPU の節を上書き)

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { fileURLToPath } from 'node:url'
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads'
import { difficultyLabel, makeCpu } from '../src/game/difficulty'
import { addPaipuStats, mergeStats, newStats, playCpuHanchan, type PlayerStats } from '../src/game/selfplay'

const seatsOf = (cpu: string) => (cpu.includes(',') ? cpu.split(',') : [cpu, cpu, cpu, cpu])
const makePlayer = (cpu: string) => seatsOf(cpu).map(makeCpu)
const cpuName = (c: string) => (c === 'latest' || c === 'strong' ? 'つよい(majiang-ai 最新版)' : c === 'easy' ? 'やさしい' : c === 'normal' ? 'ふつう(majiang-ai 0201)' : `majiang-ai ${difficultyLabel(c)}`)

if (!isMainThread) {
  // ワーカー: 渡されたシードの半荘を順に打って、成績を返す
  const { seeds, cpu } = workerData as { seeds: number[]; cpu: string }
  const stats = newStats()
  const errors: string[] = []
  for (const seed of seeds) {
    try {
      const { paipu, final } = playCpuHanchan(makePlayer(cpu), seed)
      if (final.scores.reduce((a, b) => a + b, 0) !== 100000) errors.push(`seed ${seed}: 点数の合計が100,000点ではない`)
      addPaipuStats(stats, paipu)
    } catch (e) {
      errors.push(`seed ${seed}: ${(e as Error).message}`)
    }
    parentPort!.postMessage({ progress: 1 })
  }
  parentPort!.postMessage({ stats, errors })
} else {
  const total = Number(process.argv[2] ?? 1000)
  const cpu = process.argv[3] ?? 'latest'
  const workers = Number(process.argv[4] ?? availableParallelism())
  const started = Date.now()
  const seeds = Array.from({ length: total }, (_, i) => i + 1)
  let done = 0
  const results = await Promise.all(
    Array.from({ length: workers }, (_, w) =>
      new Promise<{ stats: PlayerStats[]; errors: string[] }>((resolve, reject) => {
        const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { seeds: seeds.filter((_, i) => i % workers === w), cpu } })
        worker.on('message', (m) => {
          if (m.progress) {
            done++
            if (done % 10 === 0) console.log(`${done}/${total} 半荘(${Math.round((Date.now() - started) / 1000)}秒)`)
          } else resolve(m)
        })
        worker.on('error', reject)
      }),
    ),
  )
  const errors = results.flatMap((r) => r.errors)
  const perSeat = newStats()
  for (const r of results) r.stats.forEach((s, i) => Object.assign(perSeat[i], mergeStats([perSeat[i], s])))
  const all = mergeStats(perSeat)
  const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`
  const minutes = ((Date.now() - started) / 60000).toFixed(1)
  const section = [
    `## CPU: ${cpu.includes(',') ? seatsOf(cpu).map((c, i) => `P${i + 1} ${cpuName(c)}`).join('・') : cpuName(cpu)}(${total}半荘・${new Date().toISOString().slice(0, 10)})`,
    '',
    `- 実行: ${workers}並列で約${minutes}分。エラー・無限ループ: ${errors.length === 0 ? 'なし' : `${errors.length}件`}`,
    `- 局数: ${all.kyoku / 4}局(1半荘あたり ${(all.kyoku / 4 / total).toFixed(1)}局)`,
    '',
    '| 項目 | 全員の平均 |',
    '| --- | --- |',
    `| 和了率 | ${pct(all.hule, all.kyoku)} |`,
    `| 放銃率 | ${pct(all.fangchong, all.kyoku)} |`,
    `| 立直率 | ${pct(all.lizhi, all.kyoku)} |`,
    `| 副露率 | ${pct(all.fulouKyoku, all.kyoku)} |`,
    `| 平均打点 | ${Math.round(all.huleDefen / all.hule).toLocaleString('ja-JP')}点 |`,
    `| 平均順位(プレイヤーごと。起家は半荘ごとにランダム) | ${perSeat.map((s, i) => `P${i + 1} ${(s.rankSum / s.hanchan).toFixed(2)}`).join('・')} |`,
    ...(cpu.includes(',')
      ? [
          '',
          '| プレイヤー | 平均順位 | 1位率 | 4位率 | 和了率 | 放銃率 | 立直率 | 副露率 | 平均打点 |',
          '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
          ...perSeat.map(
            (s, i) =>
              `| P${i + 1} ${cpuName(seatsOf(cpu)[i])} | ${(s.rankSum / s.hanchan).toFixed(2)} | ${pct(s.ranks[0], s.hanchan)} | ${pct(s.ranks[3], s.hanchan)} | ${pct(s.hule, s.kyoku)} | ${pct(s.fangchong, s.kyoku)} | ${pct(s.lizhi, s.kyoku)} | ${pct(s.fulouKyoku, s.kyoku)} | ${s.hule ? Math.round(s.huleDefen / s.hule).toLocaleString('ja-JP') : '-'}点 |`,
          ),
        ]
      : []),
    '',
    ...(errors.length ? ['エラーの内容(最初の10件):', '', ...errors.slice(0, 10).map((e) => `- ${e}`), ''] : []),
  ].join('\n')

  const file = 'docs/cpu-stats.md'
  const header = '# CPU の成績(自動対局)\n\n`npm run cpu:selfplay` で CPU 4人の半荘を自動で回した結果です(Mリーグルール。牌山はシード 1〜N で固定)。\n\n'
  const old = existsSync(file) ? readFileSync(file, 'utf8') : header
  // 同じ CPU の節だけを入れ替える(見出しの最後の「(半荘数・日付)」より前が同じなら同じ CPU)
  const titleOf = (text: string) => {
    const line = text.split('\n')[0]
    return line.slice(0, line.lastIndexOf('('))
  }
  const key = titleOf(section)
  const [head, ...sections] = old.split(/(?=^## )/m)
  const kept = sections.filter((p) => titleOf(p) !== key)
  writeFileSync(file, [head.startsWith('# ') ? head : header, ...kept, section + '\n'].join(''))
  console.log(section)
  if (errors.length) process.exitCode = 1
}

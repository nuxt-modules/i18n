// temporary: summarizes the phase timings written by the e2e harness (see `PHASE_OUT`)
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'

const file = process.env.PHASE_OUT
if (!file || !existsSync(file)) {
  console.log('no phase timings recorded')
  process.exit(0)
}

const phases = new Map()
for (const line of readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
  const [spec, name, ms] = line.split('\t')
  const list = phases.get(name) ?? []
  list.push({ spec, ms: Number(ms) })
  phases.set(name, list)
}

const seconds = ms => (ms / 1000).toFixed(2) + 's'
const order = ['load', 'build', 'server', 'browser', 'tests', 'teardown', 'teardown: server', 'teardown: browser']
// the teardown parts are already counted in `teardown`
const counted = order.slice(0, 6)
const total = counted.reduce((sum, name) => sum + (phases.get(name) ?? []).reduce((a, x) => a + x.ms, 0), 0)

const rows = order.filter(name => phases.has(name)).map((name) => {
  const list = phases.get(name).toSorted((a, b) => b.ms - a.ms)
  const sum = list.reduce((a, x) => a + x.ms, 0)
  return [
    name,
    seconds(sum),
    counted.includes(name) ? (100 * sum / total).toFixed(1) + '%' : '',
    seconds(sum / list.length),
    seconds(list[Math.floor(list.length * 0.05)].ms),
    seconds(list[0].ms),
    list[0].spec,
  ]
})

const header = ['phase', 'total', 'share', 'avg per spec', 'p95', 'max', 'slowest spec']
const title = `${process.env.RUNNER_OS ?? process.platform}, ${availableParallelism()} cores, max workers: ${process.env.VITEST_MAX_WORKERS || 'default'}`
const table = [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n')

console.log(title + '\n' + table)
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${title}\n\n${table}\n`)
}

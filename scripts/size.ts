import { execFile, execFileSync } from 'node:child_process'
import { cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { availableParallelism, tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs, promisify } from 'node:util'
import { gzipSync } from 'node:zlib'

// not a workspace package, it is copied into the base checkout where the lockfile does not know it
const FIXTURE = 'test/fixtures/size'
const LOCALES = ['en', 'fr', 'ja']
const MESSAGE_GROUPS = 40
const MESSAGES_PER_GROUP = 50
const SENTINEL = 'size-sentinel-'

// keep in sync with test/fixtures/size/nuxt.config.ts
const SCENARIOS = {
  baseline: { description: 'no module', messages: false },
  minimal: { description: 'module with default options, no locale files', messages: false },
  ssr: { description: 'pages, prefixed routes and 3 locales with 2000 messages each', messages: true },
  spa: { description: 'the `ssr` app with `ssr: false`', messages: true },
  dynamic: { description: 'the `ssr` app with one locale file exporting a function', messages: true },
}

type Kind = 'client' | 'count' | 'package' | 'server'
type Measurement = { scenario: string, metric: string, kind: Kind, value: number }
type Row = Measurement & { base?: number, delta: number, percent: number, flagged: boolean }

// percentage a measurement has to move by before it is called out, counts are called out on any change
const THRESHOLDS: Record<Kind, number> = { client: 0.5, count: 0, package: 1, server: 0.5 }

const TEXT_FILE_RE = /\.(?:m?js|json|html|css)$/
const exec = promisify(execFile)
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')

const { values: args } = parseArgs({ options: { base: { type: 'string' }, out: { type: 'string' } } })

function log(message: string) {
  process.stderr.write(message + '\n')
}

function run(command: string, commandArgs: string[], cwd: string) {
  return execFileSync(command, commandArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WORDS: Record<string, string[]> = {
  en: 'the of and to in is you that it he was for on are as with his they at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part'.split(' '),
  fr: 'le de un être et à il avoir ne je son que se qui ce dans en du elle au pour pas vous par sur faire plus dire me on mon lui nous comme mais pouvoir avec tout y aller voir bien où sans tu ou leur homme si deux mari moi vouloir te femme venir quand grand celui notre devoir là jour prendre même votre rien petit encore aussi quelque dont mer trouver donner temps ça peu falloir sous parler alors main chose ton mettre vie savoir yeux passer autre après regarder toujours puis jamais cela aimer non heure croire cent monde'.split(' '),
  ja: 'こと ため それ もの よう これ ところ とき ひと なか いま まえ あと うえ した ほか わたし あなた みんな ここ そこ どこ なに だれ いつ ことば じかん ばしょ せかい くに まち いえ みず そら やま かわ うみ はな き とり いぬ ねこ ほん てがみ でんわ しごと がっこう せんせい ともだち かぞく こども おとな あさ ひる よる きょう あした きのう いく くる みる きく はなす よむ かく たべる のむ つくる つかう おもう しる わかる できる はじめる おわる あたらしい ふるい おおきい ちいさい たかい やすい'.split(' '),
}

// a spread of plain, interpolated, pluralized and linked messages so every compiler path contributes
function generateMessages(locale: string) {
  const random = mulberry32(LOCALES.indexOf(locale) + 1)
  const words = WORDS[locale]!
  const sentence = (min: number, max: number) =>
    Array.from({ length: min + Math.floor(random() * (max - min + 1)) }, () => words[Math.floor(random() * words.length)]).join(' ')

  const messages: Record<string, unknown> = {
    sentinel: SENTINEL + locale,
    nav: { home: sentence(1, 2), about: sentence(1, 2), post: sentence(1, 2), greeting: `${sentence(1, 3)} {name}` },
  }

  for (let group = 0; group < MESSAGE_GROUPS; group++) {
    const entries: Record<string, string> = {}
    for (let index = 0; index < MESSAGES_PER_GROUP; index++) {
      const form = index % 10
      entries[`key${String(index).padStart(2, '0')}`] = form === 0
        ? `${sentence(2, 5)} {name} ${sentence(2, 5)}`
        : form === 1
          ? `${sentence(2, 4)} | ${sentence(2, 4)} {count} | ${sentence(2, 4)} {count} ${sentence(1, 3)}`
          : form === 2
            ? `@:nav.home ${sentence(3, 8)}`
            : sentence(4, 12)
    }
    messages[`group${String(group).padStart(2, '0')}`] = entries
  }

  return messages
}

function generateLocaleFiles() {
  const dir = join(root, FIXTURE, 'i18n/locales')
  let bytes = 0
  for (const locale of LOCALES) {
    const contents = JSON.stringify(generateMessages(locale), null, 2) + '\n'
    writeFileSync(join(dir, `${locale}.json`), contents)
    bytes += Buffer.byteLength(contents)
  }
  return bytes
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath, entry.name))
}

// The checkout path ends up in bundler-generated identifiers and comments, raw, URL-encoded and with
// non-word characters replaced, so it is removed to compare builds made in different directories
function createReader(checkout: string) {
  const patterns = [...new Set([realpathSync(checkout), checkout])]
    .flatMap(path => [path, encodeURIComponent(path), encodeURIComponent(path).replace(/\W/g, '_')])

  return (file: string) => {
    if (!TEXT_FILE_RE.test(file)) {
      return { bytes: lstatSync(file).size, gzip: 0, copies: 0 }
    }
    let contents = readFileSync(file, 'utf8')
    for (const pattern of patterns) {
      contents = contents.replaceAll(pattern, '')
    }
    return { bytes: Buffer.byteLength(contents), gzip: gzipSync(contents).byteLength, copies: contents.split(SENTINEL).length - 1 }
  }
}

function measureScenario(checkout: string, scenario: keyof typeof SCENARIOS): Measurement[] {
  const read = createReader(checkout)
  const output = join(checkout, FIXTURE, '.output', scenario)
  const total = { clientBytes: 0, clientGzip: 0, clientCopies: 0, clientMessageBytes: 0, serverBytes: 0, serverCopies: 0 }

  for (const file of listFiles(join(output, 'public'))) {
    const { bytes, gzip, copies } = read(file)
    total.clientCopies += copies
    if (file.endsWith('.js')) {
      total.clientBytes += bytes
      total.clientGzip += gzip
      total.clientMessageBytes += copies ? bytes : 0
    }
  }

  for (const file of listFiles(join(output, 'server'))) {
    if (file.endsWith('.map')) { continue }
    const { bytes, copies } = read(file)
    total.serverBytes += bytes
    total.serverCopies += copies
  }

  const measurements: Measurement[] = [
    { scenario, metric: 'client JS', kind: 'client', value: total.clientBytes },
    { scenario, metric: 'client JS (gzip)', kind: 'client', value: total.clientGzip },
    { scenario, metric: 'server', kind: 'server', value: total.serverBytes },
  ]
  if (SCENARIOS[scenario].messages) {
    measurements.push(
      { scenario, metric: 'client JS with messages', kind: 'client', value: total.clientMessageBytes },
      { scenario, metric: 'message copies (client)', kind: 'count', value: total.clientCopies },
      { scenario, metric: 'message copies (server)', kind: 'count', value: total.serverCopies },
    )
  }
  return measurements
}

async function measure(checkout: string, label: string): Promise<Measurement[]> {
  log(`[${label}] building module`)
  run('pnpm', ['build'], checkout)

  const fixture = join(checkout, FIXTURE)
  if (checkout !== root) {
    rmSync(fixture, { recursive: true, force: true })
    cpSync(join(root, FIXTURE), fixture, { recursive: true, filter: source => !/[\\/](?:\.nuxt|\.output|node_modules)$/.test(source) })
  }
  rmSync(join(fixture, '.nuxt'), { recursive: true, force: true })
  rmSync(join(fixture, '.output'), { recursive: true, force: true })

  const measurements: Measurement[] = [
    { scenario: 'package', metric: 'dist', kind: 'package', value: listFiles(join(checkout, 'dist')).reduce((sum, file) => sum + lstatSync(file).size, 0) },
  ]

  const queue = Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]
  const results = new Map<string, Measurement[]>()
  const workers = Array.from({ length: Math.max(1, Math.min(4, Math.floor(availableParallelism() / 2))) }, async () => {
    for (let scenario = queue.shift(); scenario; scenario = queue.shift()) {
      log(`[${label}] building ${scenario}`)
      try {
        await exec('pnpm', ['exec', 'nuxt', 'build', FIXTURE], { cwd: checkout, env: { ...process.env, SIZE_SCENARIO: scenario }, maxBuffer: 64 * 1024 * 1024 })
        results.set(scenario, measureScenario(checkout, scenario))
      } catch (error) {
        // the base may not support what the fixture uses, the scenario is then reported without a comparison
        if (checkout === root) { throw error }
        log(`[${label}] ${scenario} failed to build: ${(error as { stderr?: string }).stderr || error}`)
      }
    }
  })
  await Promise.all(workers)

  for (const scenario of Object.keys(SCENARIOS)) {
    measurements.push(...results.get(scenario) ?? [])
  }
  return measurements
}

async function measureBase(ref: string) {
  const checkout = mkdtempSync(join(realpathSync(tmpdir()), 'nuxt-i18n-size-'))
  try {
    run('git', ['worktree', 'add', '--detach', checkout, ref], root)
    log('[base] installing dependencies')
    run('pnpm', ['install', '--frozen-lockfile'], checkout)
    return await measure(checkout, 'base')
  } finally {
    try {
      run('git', ['worktree', 'remove', '--force', checkout], root)
    } catch {
      rmSync(checkout, { recursive: true, force: true })
    }
  }
}

function compare(head: Measurement[], base: Measurement[] | undefined): Row[] {
  return head.map((measurement) => {
    const previous = base?.find(item => item.scenario === measurement.scenario && item.metric === measurement.metric)?.value
    const delta = previous == null ? 0 : measurement.value - previous
    const percent = previous ? (delta / previous) * 100 : 0
    const flagged = delta !== 0 && (!previous || Math.abs(percent) >= THRESHOLDS[measurement.kind])
    return { ...measurement, base: previous, delta, percent, flagged }
  })
}

function formatValue(value: number | undefined, kind: Kind) {
  if (value == null) { return '-' }
  if (kind === 'count') { return String(value) }
  if (value < 1000) { return `${value} B` }
  return value < 1_000_000 ? `${(value / 1000).toFixed(value < 100_000 ? 2 : 1)} kB` : `${(value / 1_000_000).toFixed(2)} MB`
}

function formatChange(row: Row) {
  if (row.base == null) { return 'new' }
  if (row.delta === 0) { return '0' }
  const sign = row.delta > 0 ? '+' : '-'
  const percent = row.base && row.kind !== 'count' ? ` (${sign}${Math.abs(row.percent).toFixed(2)}%)` : ''
  return `${sign}${formatValue(Math.abs(row.delta), row.kind)}${percent}`
}

function toTable(rows: Row[]) {
  return [
    '| Scenario | Measurement | Base | Head | Change |',
    '| --- | --- | ---: | ---: | ---: |',
    ...rows.map(row => `| ${row.scenario} | ${row.metric} | ${formatValue(row.base, row.kind)} | ${formatValue(row.value, row.kind)} | ${formatChange(row)} |`),
  ]
}

function toMarkdown(rows: Row[], baseRef: string, headRef: string, sourceBytes: number) {
  const flagged = rows.filter(row => row.flagged)
  const lines = [`Comparing \`${baseRef}\` (base) with \`${headRef}\` (head).`, '']

  if (flagged.length) {
    lines.push(`**${flagged.length} of ${rows.length} measurements moved beyond their threshold:**`, '', ...toTable(flagged), '')
  } else {
    lines.push('No measurement moved beyond its threshold.', '')
  }

  lines.push(
    '<details>',
    '<summary>All measurements</summary>',
    '',
    ...toTable(rows),
    '',
    ...Object.entries(SCENARIOS).map(([name, scenario]) => `- \`${name}\`: ${scenario.description}`),
    `- client JS with messages: the client chunks that contain generated messages, the locale files are ${formatValue(sourceBytes, 'client')} in total`,
    '- message copies: how often the generated messages of a locale appear in the output',
    '',
    'Hashes derived from the checkout path can move a size by a few bytes without a change in the code.',
    '',
    '</details>',
  )
  return lines.join('\n')
}

function toText(rows: Row[], compared: boolean) {
  const cells = rows.map(row => [
    row.scenario,
    row.metric,
    ...(compared ? [formatValue(row.base, row.kind)] : []),
    formatValue(row.value, row.kind),
    ...(compared ? [formatChange(row) + (row.flagged ? ' !' : '')] : []),
  ])
  const widths = cells[0]!.map((_, column) => Math.max(...cells.map(row => row[column]!.length)))
  return cells.map(row => row.map((cell, column) => column < 2 ? cell.padEnd(widths[column]!) : cell.padStart(widths[column]!)).join('  ')).join('\n')
}

const sourceBytes = generateLocaleFiles()

const head = await measure(root, 'head')
const base = args.base ? await measureBase(args.base) : undefined
const rows = compare(head, base)

process.stdout.write(toText(rows, !!base) + '\n')

if (args.out) {
  const headRef = run('git', ['rev-parse', 'HEAD'], root)
  const baseRef = args.base ? run('git', ['rev-parse', args.base], root) : headRef
  mkdirSync(args.out, { recursive: true })
  writeFileSync(join(args.out, 'summary.md'), toMarkdown(rows, baseRef.slice(0, 8), headRef.slice(0, 8), sourceBytes) + '\n')
  // read by .github/workflows/size-comment.yml, which validates every value before rendering it
  writeFileSync(join(args.out, 'report.json'), JSON.stringify({
    base: baseRef,
    rows: rows.map(({ scenario, metric, kind, value, base, flagged }) => ({ scenario, metric, kind, value, base, flagged })),
  }, null, 2) + '\n')
}

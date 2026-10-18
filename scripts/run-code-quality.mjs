import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import process from 'node:process'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = resolve(root, '.quality-output')
mkdirSync(output, { recursive: true })

function run(script, args) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...args], { cwd: root, stdio: 'inherit' })
  if (result.error) console.error(result.error.message)
  return result.status ?? 1
}

// Fresh report names prevent a failed run from reusing the previous run's metrics.
const stamp = `${Date.now()}-${process.pid}`
const lintPath = resolve(output, `eslint-${stamp}.json`)
const testsPath = resolve(output, `vitest-${stamp}.json`)
const coveragePath = resolve(output, `coverage-${stamp}`)
console.log('=== Static analysis: ESLint ===')
const lintExit = run('node_modules/eslint/bin/eslint.js', ['.', '--format', 'json', '--output-file', lintPath])
console.log('=== Test coverage: Vitest V8 ===')
const testExit = run('node_modules/vitest/vitest.mjs', ['run', '--coverage', '--maxWorkers=2', '--testTimeout=15000', '--reporter=default', '--reporter=json',
  `--outputFile.json=${testsPath}`, `--coverage.reportsDirectory=${coveragePath}`,
  '--coverage.reporter=json-summary', '--coverage.reporter=html', '--coverage.reporter=lcov'])

const readJson = (path) => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
const lint = readJson(lintPath)
const tests = readJson(testsPath)
const coverage = readJson(resolve(coveragePath, 'coverage-summary.json'))
const errors = lint?.reduce((sum, file) => sum + file.errorCount, 0) ?? null
const warnings = lint?.reduce((sum, file) => sum + file.warningCount, 0) ?? null
const passed = tests?.numPassedTests ?? 0
const total = tests?.numTotalTests ?? 0
const failed = tests?.numFailedTests ?? 0
const skipped = (tests?.numPendingTests ?? 0) + (tests?.numTodoTests ?? 0)
const findings = lint?.flatMap(file => file.messages.map(message => ({
  rule: message.ruleId ?? 'parser', level: message.severity === 2 ? 'error' : 'warning',
  message: message.message, file: file.filePath, line: message.line ?? 0,
}))) ?? []
const gate = lintExit === 0 && testExit === 0 && errors === 0 && total > 0 && failed === 0 && coverage ? 'PASS' : 'FAIL'
const linePct = coverage ? `${coverage.total.lines.pct}%` : 'Unavailable'
const branchPct = coverage ? `${coverage.total.branches.pct}%` : 'Unavailable'
const summary = `## Frontend: Code Quality & Metrics

| Quality gate | ESLint errors | ESLint warnings | Tests passed / total | Skipped | Line coverage | Branch coverage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ${gate} | ${errors ?? 'Unavailable'} | ${warnings ?? 'Unavailable'} | ${passed} / ${total} | ${skipped} | ${linePct} | ${branchPct} |

Gate: no ESLint errors, successful tests, and generated coverage reports. Warnings are advisory.
Download **quality-evidence** and open **dashboard.html** or the coverage directory's **index.html**.
`
writeFileSync(resolve(output, 'summary.md'), summary)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
const encode = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const rows = findings.map(item => `<tr><td>${encode(item.rule)}</td><td>${encode(item.level)}</td><td>${encode(item.message)}</td><td>${encode(item.file)}:${item.line}</td></tr>`).join('')
const coverageDirectory = coveragePath.split(/[\\/]/).at(-1)
writeFileSync(resolve(output, 'dashboard.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>Frontend quality metrics</title>
<style>body{font:16px system-ui;margin:40px;line-height:1.6;background:#f7f9fc;color:#172033}table{border-collapse:collapse;background:white;width:100%;margin:20px 0}td,th{border:1px solid #d6deea;padding:10px;text-align:left}</style>
<h1>Frontend: Code Quality &amp; Metrics</h1><p>Quality gate: <strong>${gate}</strong></p>
<table><tr><th>ESLint errors</th><th>Warnings</th><th>Tests passed / total</th><th>Line coverage</th><th>Branch coverage</th></tr><tr><td>${errors ?? 'Unavailable'}</td><td>${warnings ?? 'Unavailable'}</td><td>${passed} / ${total}</td><td>${linePct}</td><td>${branchPct}</td></tr></table>
<p><a href="${coverageDirectory}/index.html">Open the source-level coverage dashboard</a></p>
<h2>Static analysis findings</h2><table><tr><th>Rule</th><th>Severity</th><th>Finding</th><th>Source</th></tr>${rows}</table>
<p>Warnings are advisory. ESLint errors, test failures or missing reports fail the gate. No technical-debt estimate or SonarQube rating is calculated.</p></html>`)
writeFileSync(resolve(output, 'metrics.json'), JSON.stringify({ gate, errors, warnings, passed, total, skipped, lineCoverage: linePct, branchCoverage: branchPct, findings }, null, 2))
console.log(summary)
console.log(`Dashboard: ${resolve(output, 'dashboard.html')}`)
process.exitCode = gate === 'PASS' ? 0 : 1

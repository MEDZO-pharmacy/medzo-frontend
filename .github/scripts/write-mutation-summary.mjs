import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const reportPath = 'reports/mutation/mutation.json'

if (!existsSync(reportPath)) {
  const message = 'Mutation summary was not generated.\n'
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, message)
  else process.stdout.write(message)
  process.exit(0)
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const statuses = ['Killed', 'Survived', 'Timeout', 'NoCoverage', 'Ignored', 'CompileError', 'RuntimeError']

const countStatuses = (mutants) => Object.fromEntries(
  statuses.map((status) => [status, mutants.filter((mutant) => mutant.status === status).length]),
)

const summarize = (mutants) => {
  const counts = countStatuses(mutants)
  const detected = counts.Killed + counts.Timeout
  const undetected = counts.Survived + counts.NoCoverage
  const scored = detected + undetected
  return {
    ...counts,
    detected,
    undetected,
    total: mutants.length,
    score: scored === 0 ? 'N/A' : `${((detected / scored) * 100).toFixed(2)}%`,
  }
}

const escapeCell = (value) => String(value).replaceAll('|', '\\|')
const allMutants = Object.values(report.files).flatMap((file) => file.mutants)
const rows = Object.entries(report.files).map(([fileName, file]) => {
  const result = summarize(file.mutants)
  return `| ${escapeCell(fileName)} | ${result.score} | ${result.Killed} | ${result.Survived} | ${result.Timeout} | ${result.NoCoverage} | ${result.Ignored} | ${result.CompileError} | ${result.RuntimeError} | ${result.detected} | ${result.undetected} | ${result.total} |`
})
const total = summarize(allMutants)
const thresholds = report.thresholds ?? {}

const summary = [
  '# Mutation Testing Summary',
  '',
  '| File | Score | Killed | Survived | Timeout | No Coverage | Ignored | Compile Errors | Runtime Errors | Total Detected | Total Undetected | Total Mutants |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...rows,
  '',
  `## The final mutation score is ${total.score}`,
  '',
  `*Coverage thresholds: high:${thresholds.high ?? 'N/A'} low:${thresholds.low ?? 'N/A'} break:${thresholds.break ?? 'N/A'}*`,
  '',
].join('\n')

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
else process.stdout.write(summary)

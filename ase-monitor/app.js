const data = window.ASE_PIPELINE_DATA || {}

const roles = [
  { key: 'unit', member: 'Member 1', title: 'Unit Testing & Mocking', tool: 'xUnit · Moq · Coverlet', branch: 'feature/se3112-unit-mocking', evidence: 'TRX results + code coverage', accent: '#37d69c' },
  { key: 'mutation', member: 'Member 2', title: 'Mutation Testing', tool: 'Stryker.NET', branch: 'catalogue-mutation-testing', evidence: 'Mutation HTML/JSON reports + score gate', accent: '#a78bfa' },
  { key: 'uiE2e', member: 'Member 3', title: 'UI / E2E Testing', tool: 'Playwright · Chromium', branch: 'feature/se3112-unified-testing-pipeline', evidence: '13 targeted cases + HTML report/traces', accent: '#60a5fa' },
  { key: 'quality', member: 'Member 4', title: 'Code Quality & Metrics', tool: '.NET analyzers · Coverlet', branch: 'feature/se3112-code-quality', evidence: 'Analyzer warnings + coverage quality gate', accent: '#fb923c' },
]

const normalizeStatus = (value) => ['success', 'failure', 'cancelled', 'skipped'].includes(value) ? value : 'ready'
const roleGrid = document.querySelector('#role-grid')

roles.forEach((role) => {
  const status = normalizeStatus(data.roles?.[role.key])
  const article = document.createElement('article')
  article.className = 'role-card'
  article.style.setProperty('--accent', role.accent)
  article.innerHTML = `
    <div class="card-top">
      <div><span class="member">${role.member} · Official role</span><h3>${role.title}</h3><p class="tool">${role.tool}</p></div>
      <span class="status-pill status-${status}">${status}</span>
    </div>
    <dl class="card-details">
      <div><dt>Owned source branch</dt><dd>${role.branch}</dd></div>
      <div><dt>Uploaded evidence</dt><dd>${role.evidence}</dd></div>
    </dl>`
  roleGrid.append(article)
})

document.querySelector('#branch').textContent = data.branch || 'Unknown'
document.querySelector('#run-number').textContent = data.runNumber ? `#${data.runNumber}` : 'Unknown'
document.querySelector('#updated').textContent = data.updated || 'Unknown'

const officialStatuses = roles.map((role) => normalizeStatus(data.roles?.[role.key]))
const performanceStatus = normalizeStatus(data.roles?.performance)
const allStatuses = [...officialStatuses, performanceStatus]
const gateStatus = allStatuses.some((status) => ['failure', 'cancelled'].includes(status))
  ? 'failure'
  : allStatuses.every((status) => status === 'success') ? 'success' : 'ready'

const gate = document.querySelector('#gate')
gate.classList.add(gateStatus)
document.querySelector('#gate-label').textContent = gateStatus === 'success' ? 'All checks passed' : gateStatus === 'failure' ? 'Action required' : 'Ready to run'
document.querySelector('#role-summary').textContent = `${officialStatuses.filter((status) => status === 'success').length} of 4 official roles passed in this run.`

const performance = document.querySelector('#performance-status')
performance.className = `status-pill status-${performanceStatus}`
performance.textContent = performanceStatus

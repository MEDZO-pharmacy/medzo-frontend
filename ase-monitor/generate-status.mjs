import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const output = fileURLToPath(new URL('./run-status.js', import.meta.url))
const payload = {
  branch: process.env.ASE_BRANCH || 'unknown',
  runNumber: process.env.ASE_RUN_NUMBER || 'unknown',
  updated: new Date().toISOString(),
  roles: {
    unit: process.env.ASE_UNIT || 'skipped',
    mutation: process.env.ASE_MUTATION || 'skipped',
    uiE2e: process.env.ASE_UI_E2E || 'skipped',
    quality: process.env.ASE_QUALITY || 'skipped',
    performance: process.env.ASE_PERFORMANCE || 'skipped',
  },
}

await writeFile(output, `window.ASE_PIPELINE_DATA = ${JSON.stringify(payload, null, 2)}\n`, 'utf8')

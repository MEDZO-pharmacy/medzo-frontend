# ASE Pipeline Monitor

This is a read-only static dashboard for the SE3112 unified testing pipeline. It is uploaded as a GitHub Actions artifact and is deliberately isolated from the deployable MEDZO application.

- It does not import or modify application source code.
- It does not call the deployed frontend, microservices, or database.
- It is not included in the production Vite build or deployment workflow.
- `run-status.js` is generated inside the unified workflow from job results.

Download and extract the `ase-testing-monitor-*` artifact, then open `index.html` in a browser.

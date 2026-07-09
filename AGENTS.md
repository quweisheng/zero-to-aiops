# Repository Agent Rules

## Tech Stack Deep-Dive Writing

- When adding or expanding any `docs/tech-stack/**/*.md` article, first read `docs/tech-stack/writing-standard.md` and `docs/templates/tech-stack-deep-dive.md`.
- Treat the writing standard as mandatory, not optional. A tech-stack article is not complete until a beginner can follow it from zero, understand the core ideas, run the first experiment, troubleshoot common failures, and explain the topic in an interview.
- Do not write shallow outlines or copied documentation. Reorganize official docs and hands-on learning into an original Chinese tutorial for AIOps learners. Link to official sources, but do not translate or copy long official passages.
- Every new tech-stack article must include the fixed learning path: learning goal, official resources, official knowledge map, scenario opening, plain-language one-sentence explanation, beginner questions, why it matters, what it is, what problem it solves, core principles, architecture/data flow, install/startup, configuration explanation, common commands or queries, AIOps use cases, beginner experiment, troubleshooting, learning checklist, interview questions, and GitHub learning evidence.
- For every core concept, explain the five required parts: what it is, why it is needed, how it works, how to use or observe it, and how to troubleshoot it when it breaks.
- For commands, configuration fields, APIs, queries, and UI operations, explain them like a beginner dictionary: purpose, common syntax or setting, key fields or parameters, expected result, AIOps scenario, and common pitfalls.
- For every code, command, SQL, query, YAML, JSON, shell, Python, configuration, or pseudo-code example in any tech-stack article, add line-by-line beginner comments or an immediately following line-by-line explanation. Do not leave unexplained example blocks. Every line should tell a true beginner what that line does, why it appears there, or what value should be changed in a real AIOps scenario.
- Always include at least one reproducible beginner experiment with exact steps, expected output, verification method, and a "if it did not work, check these first" troubleshooting loop.
- Do not assume the reader already understands Kubernetes, Python, machine learning, observability, networking, or Linux internals. The first time an English acronym, component name, config field, metric, protocol, or command appears, explain it in plain language.
- Every article must explicitly connect the topic to the AIOps chain: metrics, logs, traces, alerts, automation, anomaly detection, root-cause analysis, runbooks, models, or knowledge bases.
- Every article must end with learning evidence that can be committed to GitHub, such as config files, screenshots, dashboards, notes, troubleshooting records, or a small runnable project.
- If the topic is too large to cover every advanced edge case, clearly state the boundary, cover the beginner-to-practical AIOps path completely, and point to the next official or repository section for deeper study.

## Publishing

- Do not stage, commit, or push `docs/superpowers/` during routine documentation publishing.
- Treat `docs/superpowers/` as local planning/spec material unless the user explicitly asks to publish it.
- When publishing docs updates, stage files explicitly instead of using broad commands that may include `docs/superpowers/`.
- Before pushing, run `git status -sb` and confirm no `docs/superpowers/` changes are staged.
- Before every GitHub push, run the local gates that match the changed surface:
  - `npm test`
  - `npm run build`
  - `powershell -ExecutionPolicy Bypass -File C:\Users\qws\.codex\skills\aiops-docs-publish\scripts\check-zero-to-aiops-docs.ps1 -Repo D:\zero-to-aiops`
  - `git diff --check -- README.md docs public src .github AGENTS.md package.json`
- After staging and before committing, run `git diff --cached --name-only` and verify the staged files are only the intended files.
- After pushing to `origin/main`, verify the remote head with `git ls-remote origin refs/heads/main`.
- After each push, check the latest GitHub Actions `Deploy React site` run for the pushed commit and do not treat publishing as complete until the remote workflow is `completed` with `success`.
- If `gh` is unavailable, use the GitHub Actions API with PowerShell `Invoke-RestMethod` to inspect `https://api.github.com/repos/quweisheng/zero-to-aiops/actions/runs?per_page=5`.
- If GitHub Pages deployment fails with a transient `Deployment failed, try again later` error, rerun or push a retry-safe workflow fix and verify the next deploy succeeds before reporting completion.

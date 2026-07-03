# Repository Agent Rules

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

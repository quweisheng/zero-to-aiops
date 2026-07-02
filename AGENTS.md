# Repository Agent Rules

## Publishing

- Do not stage, commit, or push `docs/superpowers/` during routine documentation publishing.
- Treat `docs/superpowers/` as local planning/spec material unless the user explicitly asks to publish it.
- When publishing docs updates, stage files explicitly instead of using broad commands that may include `docs/superpowers/`.
- Before pushing, run `git status -sb` and confirm no `docs/superpowers/` changes are staged.

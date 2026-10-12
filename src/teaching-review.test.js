import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { articleDigest, auditTeachingReviews, inspectReview, reviewCriteria } from '../scripts/audit-teaching-reviews.mjs'

const raw = '# 测试课程\n\n正文'
const record = () => ({
  article: 'foundation/example.md', writer: 'author', reviewedAt: '2026-10-12',
  initialFindings: ['原课缺少新输入下的判定规则'], changes: ['新增独立练习及反例'],
  criteria: reviewCriteria.map(id => ({ id, result: 'pass', evidence: '准确小节及其判断依据' })),
  validation: [{ kind: 'reasoned', detail: '正文审校', limits: '不等于真实服务实跑' }],
  crossReview: { reviewer: 'second-reader', reviewedAt: '2026-10-12', result: 'pass', articleSha256: articleDigest(raw), findings: ['复查实验输入、状态边界及答案因果链'] },
})
const fixtureDirs = []
afterEach(async () => {
  await Promise.all(fixtureDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})
async function reviewFixture(articleRaw = raw, records) {
  const workspace = await mkdtemp(join(tmpdir(), 'aiops-teaching-review-'))
  fixtureDirs.push(workspace)
  const root = join(workspace, 'docs/tech-stack')
  await mkdir(root, { recursive: true })
  await mkdir(join(root, 'foundation'))
  await mkdir(join(root, 'reviews'))
  await writeFile(join(root, 'foundation/example.md'), articleRaw)
  const item = record(); item.crossReview.articleSha256 = articleDigest(articleRaw)
  await writeFile(join(root, 'reviews/review.json'), JSON.stringify(records ?? [item]))
  return root
}
describe('version-bound teaching reviews', () => {
  it('does not pass an unreviewed article', () => expect(inspectReview(null, raw).complete).toBe(false))
  it('accepts a complete version-bound editorial review', () => expect(inspectReview(record(), raw).complete).toBe(true))
  it('invalidates a review after any article edit', () => expect(inspectReview(record(), `${raw}修改`).status).toContain('需重新审校'))
  it('keeps the same digest across Git Windows/Linux line endings', () => expect(articleDigest('\uFEFF# 课程\r\n正文')).toBe(articleDigest('# 课程\n正文')))
  it('does not let author self-review replace independent review', () => {
    const item = record(); item.crossReview.reviewer = item.writer
    expect(inspectReview(item, raw).complete).toBe(false)
  })
  it('recognizes the same internal reviewer ID despite case or surrounding spaces', () => {
    const item = record(); item.writer = ' Author '; item.crossReview.reviewer = 'AUTHOR'
    expect(inspectReview(item, raw).status).toBe('待独立审校')
  })
  it.each(['not-a-date', '2026-2-01', '2026-13-01', '2026-00-01', '2026-01-00', '2026-04-31', '2026-02-29', '1900-02-29'])('rejects non-calendar review date %s for both reviewers', date => {
    const author = record(); author.reviewedAt = date
    const cross = record(); cross.crossReview.reviewedAt = date
    expect(inspectReview(author, raw).complete).toBe(false)
    expect(inspectReview(cross, raw).complete).toBe(false)
  })
  it.each(['2024-02-29', '2000-02-29', '2026-10-12'])('accepts valid ISO calendar review date %s', date => {
    const item = record(); item.reviewedAt = date; item.crossReview.reviewedAt = date
    expect(inspectReview(item, raw).complete).toBe(true)
  })
  it('keeps a failed criterion open even when all others pass', () => {
    const item = record(); item.criteria[2].result = 'needs-work'
    expect(inspectReview(item, raw).status).toBe('待返工')
  })
  it('rejects duplicate or missing criteria', () => {
    const item = record(); item.criteria[2] = item.criteria[1]
    expect(inspectReview(item, raw).status).toBe('记录不完整')
  })
  it('requires cross review and its concrete findings', () => {
    const item = record(); delete item.crossReview
    expect(inspectReview(item, raw).status).toBe('已修订，待交叉审校')
    item.crossReview = { reviewer: 'second-reader', reviewedAt: '2026-10-12', result: 'pass', articleSha256: articleDigest(raw), findings: [] }
    expect(inspectReview(item, raw).complete).toBe(false)
  })
  it('reports malformed evidence without throwing or passing it', () => {
    for (const field of ['validation', 'initialFindings', 'changes']) {
      const item = record(); item[field] = 'not-an-array'
      expect(inspectReview(item, raw).status).toBe('记录不完整')
    }
    const item = record(); item.criteria[0] = null
    expect(inspectReview(item, raw).complete).toBe(false)
    item.criteria = record().criteria; item.criteria[0].evidence = 42
    expect(inspectReview(item, raw).complete).toBe(false)
    item.criteria = record().criteria; item.crossReview.findings = [' ']
    expect(inspectReview(item, raw).complete).toBe(false)
  })
})

describe('teaching review reports', () => {
  it.each([
    '\uFEFF# 标题课程\n\n```text\n# HELP fake_metric A code comment\n```',
    '~~~text\n# 不是标题\n~~~\n\n# 标题课程\n\n正文',
    '````markdown\n```\n# 不是标题\n```\n````\n\n# 标题课程',
    '```markdown\n~~~\n# 不是标题\n~~~\n```\n\n# 标题课程',
    '```text\n``` still code\n# 不是标题\n```\n\n# 标题课程',
  ])('uses the actual Markdown title rather than BOM or fenced comments', async articleRaw => {
    const root = await reviewFixture(articleRaw)
    await auditTeachingReviews({ root, write: true, quiet: true })
    const report = await readFile(join(root, 'teaching-review.md'), 'utf8')
    expect(report).toContain('[标题课程](./foundation/example.md)')
    expect(report).toContain('### 标题课程')
  })
  it('writes an incomplete report and a diagnostic rather than crashing on malformed evidence', async () => {
    const item = record()
    item.validation = 'not-an-array'; item.initialFindings = null; item.changes = [null]; item.criteria = [null]; item.crossReview.findings = 42
    const root = await reviewFixture(raw, [item])
    await expect(auditTeachingReviews({ root, write: true, quiet: true })).rejects.toThrow('Teaching review evidence is incomplete')
    const report = await readFile(join(root, 'teaching-review.md'), 'utf8')
    expect(report).toContain('0 篇当前版本通过正文交叉审校')
    expect(report).toContain('记录不完整')
  })
  it.each(['{broken', 'null', '{}', '[null]', '[{"article":3}]', '[{"article":{"toString":null}}]', '[{"article":"../escape.md"}]'])('rejects malformed review file %s with a readable report', async payload => {
    const root = await reviewFixture()
    await writeFile(join(root, 'reviews/review.json'), payload)
    await expect(auditTeachingReviews({ root, write: true, requireComplete: true, quiet: true })).rejects.toThrow('Teaching review evidence is incomplete')
    const report = await readFile(join(root, 'teaching-review.md'), 'utf8')
    expect(report).toContain('## 记录错误')
    expect(report).toContain('0 篇当前版本通过正文交叉审校')
  })
  it('can display rejected JSON objects even when they shadow toString', async () => {
    const item = record()
    item.initialFindings = [{ toString: null }]; item.reviewedAt = { toString: 3 }
    item.validation[0].detail = { toString: false }; item.crossReview.findings = [{ toString: {} }]
    const root = await reviewFixture(raw, [item])
    await expect(auditTeachingReviews({ root, write: true, quiet: true })).rejects.toThrow('Teaching review evidence is incomplete')
    const report = await readFile(join(root, 'teaching-review.md'), 'utf8')
    expect(report).toContain('记录不完整')
    expect(report).toContain('{"toString":false}')
  })
  it.each([{ toString: false }, [{ toString: false }]])('reports non-text validation kinds without coercing them during table rendering', async kind => {
    const item = record(); item.validation[0].kind = kind
    const root = await reviewFixture(raw, [item])
    await expect(auditTeachingReviews({ root, write: true, quiet: true })).rejects.toThrow('Teaching review evidence is incomplete')
    expect(await readFile(join(root, 'teaching-review.md'), 'utf8')).toContain('验证类型或边界不完整')
  })
  it.each(['empty', 'missing'])('never passes a required review gate with an %s article directory', async kind => {
    let root = await reviewFixture(raw, [])
    if (kind === 'empty') await rm(join(root, 'foundation/example.md'))
    else root = join(root, 'missing')
    await expect(auditTeachingReviews({ root, requireComplete: true, quiet: true })).rejects.toThrow('Teaching review evidence is incomplete')
  })
  it('allows normal report generation to retain pending work without calling it reviewed', async () => {
    const root = await reviewFixture(raw, [])
    const summary = await auditTeachingReviews({ root, write: true, quiet: true })
    expect(summary).toMatchObject({ total: 1, crossReviewed: 0, pending: [{ path: 'foundation/example.md', status: '未评测' }] })
  })
  it.each(['unreviewed', 'stale', 'malformed', 'empty'])('the required CLI prints its %s summary and exits nonzero', async kind => {
    const root = await reviewFixture(raw, kind === 'unreviewed' ? [] : undefined)
    if (kind === 'stale') await writeFile(join(root, 'foundation/example.md'), `${raw}\n新正文`)
    if (kind === 'malformed') await writeFile(join(root, 'reviews/review.json'), '[null]')
    if (kind === 'empty') {
      await rm(join(root, 'foundation/example.md'))
      await writeFile(join(root, 'reviews/review.json'), '[]')
    }
    const result = spawnSync(process.execPath, [resolve('scripts/audit-teaching-reviews.mjs'), '--require-complete'], { cwd: resolve(root, '../..'), encoding: 'utf8' })
    expect(result.status).toBe(1)
    const summary = JSON.parse(result.stdout)
    expect(summary.pending.length + summary.errors.length).toBeGreaterThan(0)
    expect(result.stderr).toContain('Teaching review evidence is incomplete')
    expect(result.stderr).not.toContain('at auditTeachingReviews')
  })
})

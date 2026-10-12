import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractTitle } from './content-utils.mjs'

export const reviewCriteria = ['prerequisites', 'mechanism', 'foundation', 'fault', 'production', 'interview', 'mastery', 'aiops']
const labels = ['前置与路线', '机制与状态', '基础实验', '故障实验', '生产取舍', '递进面试', '独立通关', 'AIOps 与证据']
// Git may check out CRLF on Windows and LF on CI; normalize only transport text.
export const articleDigest = raw => createHash('sha256').update(raw.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n')).digest('hex')
const isCalendarDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
}

// This checks the integrity of editorial evidence, not the truth of the lesson.
export function inspectReview(record, raw) {
  if (!record) return { status: '未评测', complete: false, errors: [] }
  const errors = []
  const hasText = value => typeof value === 'string' && value.trim().length > 0
  for (const field of ['initialFindings', 'changes', 'validation']) {
    if (!Array.isArray(record[field]) || record[field].length === 0) errors.push(`缺少 ${field}`)
  }
  for (const field of ['initialFindings', 'changes']) {
    if (Array.isArray(record[field]) && record[field].some(item => !hasText(item))) errors.push(`${field} 含空白或非文本证据`)
  }
  const checks = Array.isArray(record.criteria) ? record.criteria : []
  for (const id of reviewCriteria) {
    const matches = checks.filter(check => check?.id === id)
    if (matches.length !== 1 || !hasText(matches[0]?.evidence)) errors.push(`缺少或重复评测证据 ${id}`)
  }
  if (checks.some(check => !reviewCriteria.includes(check?.id) || !['pass', 'needs-work'].includes(check?.result))) errors.push('评测维度或结果非法')
  if (!isCalendarDate(record.reviewedAt)) errors.push('评测日期须为真实 ISO 日历日期 YYYY-MM-DD')
  if (!hasText(record.writer)) errors.push('缺少作者审校身份')
  if (Array.isArray(record.validation) && record.validation.some(item => !['executed', 'syntax', 'reasoned', 'unrun'].includes(item?.kind) || !hasText(item?.detail) || !hasText(item?.limits))) errors.push('验证类型或边界不完整')
  if (errors.length) return { status: '记录不完整', complete: false, errors }
  if (checks.some(check => check.result !== 'pass')) return { status: '待返工', complete: false, errors }
  const cross = record.crossReview
  if (!cross) return { status: '已修订，待交叉审校', complete: false, errors }
  if (!hasText(cross.reviewer) || !isCalendarDate(cross.reviewedAt) || !Array.isArray(cross.findings) || cross.findings.length === 0 || cross.findings.some(item => !hasText(item))) {
    return { status: '交叉审校记录不完整', complete: false, errors: ['第二位审校者缺少身份、日期或具体结论'] }
  }
  // These are internal editorial role IDs, not cryptographic human identities.
  if (cross.reviewer.trim().toLowerCase() === record.writer.trim().toLowerCase()) return { status: '待独立审校', complete: false, errors: ['作者不可替代第二位审校者'] }
  if (cross.articleSha256 !== articleDigest(raw)) return { status: '文章已变，需重新审校', complete: false, errors }
  if (cross.result !== 'pass') return { status: '交叉审校要求返工', complete: false, errors }
  return { status: '交叉审校通过（正文）', complete: true, errors }
}

async function filesIn(dir, extension) {
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(resolve(dir, entry.name), extension)
    : entry.name.endsWith(extension) ? [resolve(dir, entry.name)] : []))).flat()
}

const display = value => {
  if (typeof value === 'string') return value
  try { return JSON.stringify(value) ?? '无文本' } catch { return '无法显示的非文本值' }
}
const cell = value => display(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
const list = value => Array.isArray(value) ? value : []
export async function auditTeachingReviews({ root = resolve('docs/tech-stack'), write = false, requireComplete = false, quiet = false } = {}) {
  const articles = (await filesIn(root, '.md')).filter(file => /[/\\]/.test(relative(root, file)))
  const records = new Map()
  const errors = []
  for (const file of await filesIn(resolve(root, 'reviews'), '.json')) {
    let group
    try { group = JSON.parse(await readFile(file, 'utf8')) } catch (error) {
      errors.push(`评测文件无法读取或 JSON 非法 ${relative(root, file)}: ${error.message}`)
      continue
    }
    if (!Array.isArray(group)) { errors.push(`评测文件必须是数组: ${relative(root, file)}`); continue }
    for (const record of group) {
      if (typeof record?.article !== 'string' || !record.article || record.article.includes('..') || record.article.includes('\\') || record.article.startsWith('/')) {
        errors.push(`非法文章路径 (${relative(root, file)}): ${display(record?.article)}`); continue
      }
      if (records.has(record.article)) errors.push(`重复文章记录: ${record.article}`)
      records.set(record.article, record)
    }
  }
  const rows = []
  for (const file of articles.sort()) {
    const path = relative(root, file).replaceAll('\\', '/')
    const raw = await readFile(file, 'utf8')
    const record = records.get(path)
    const result = inspectReview(record, raw)
    errors.push(...result.errors.map(error => `${path}: ${error}`))
    const title = extractTitle(raw)
    rows.push({ path, title: title === 'Untitled' ? path : title, record, ...result })
  }
  for (const path of records.keys()) if (!rows.some(row => row.path === path)) errors.push(`记录无对应文章: ${path}`)
  if (requireComplete && rows.length === 0) errors.push('未发现技术栈文章，不能把空目录或错误工作目录判为全部通过')
  const summary = {
    total: rows.length, revised: rows.filter(row => row.record).length,
    crossReviewed: rows.filter(row => row.complete).length,
    pending: rows.filter(row => !row.complete).map(row => ({ path: row.path, status: row.status })), errors,
  }
  if (write) {
    const lines = [
      '# 技术栈逐篇评测与返工记录', '',
      '本轮以 2026-10-12 精讲评测标准逐篇审校。这里记录正文的具体问题、修订和第二位审校者结论；不是自动关键词评分，也不表示读者已经掌握或全部真实产品已实跑。篇幅另见[正文统计](./teaching-coverage.md)，评测方法见[写作标准](./writing-standard.md#逐篇评测返工与独立通关)。', '',
      `当前 ${summary.total} 篇：${summary.revised} 篇已有本轮修订记录，${summary.crossReviewed} 篇当前版本通过正文交叉审校，${summary.pending.length} 篇仍待处理。文章内容变化后旧审校自动失效；版本摘要只统一 UTF-8 文件开头标记及 Windows/Linux 换行，不忽略正文修改。未审校条目不会因字数够长而自动通过。`, '',
      '验证类型：executed 表示确实执行了所述有限检查；syntax 只检查语法；reasoned 是正文和证据推理；unrun 是尚未运行的环境。它们不能互相替代，运行了模拟也不等于验证了真实产品或生产系统。', '',
      '| 技术栈 | 当前正文评测 | 初评问题数 | 实际验证范围 |', '|---|---|---:|---|',
      ...rows.map(row => `| [${cell(row.title)}](./${row.path}) | ${row.status} | ${Array.isArray(row.record?.initialFindings) ? row.record.initialFindings.length : '—'} | ${cell(list(row.record?.validation).map(item => item?.kind).filter((kind, index, all) => typeof kind === 'string' && all.indexOf(kind) === index).join(' / ') || '尚无记录')} |`), '',
      ...(errors.length ? ['## 记录错误', '', ...errors.map(error => `- ${cell(error)}`), ''] : []),
      '## 逐篇证据', '',
    ]
    for (const row of rows.filter(row => row.record)) {
      const record = row.record
      lines.push(`### ${row.title}`, '', `[打开课程](./${row.path})；作者复评日期：${cell(record.reviewedAt)}；当前结论：${row.status}。`, '', '**初评发现与返工**', '',
        ...list(record.initialFindings).map(item => `- 初评：${cell(item)}`), ...list(record.changes).map(item => `- 修订：${cell(item)}`), '', '**八项正文证据**', '')
      for (const [index, id] of reviewCriteria.entries()) {
        const check = list(record.criteria).find(item => item?.id === id)
        lines.push(`- ${labels[index]}：${check?.result === 'pass' ? '作者复评通过' : '待返工'}。${cell(check?.evidence || '无证据')}`)
      }
      lines.push('', '**验证边界**', '', ...list(record.validation).map(item => `- ${cell(item?.kind)}：${cell(item?.detail)}；限制：${cell(item?.limits)}`))
      if (record.crossReview) lines.push('', `第二位审校者：${cell(record.crossReview.reviewer)}；日期：${cell(record.crossReview.reviewedAt)}。`, '', ...list(record.crossReview.findings).map(item => `- ${cell(item)}`))
      lines.push('')
    }
    await writeFile(resolve(root, 'teaching-review.md'), lines.join('\n'), 'utf8')
  }
  if (!quiet) console.log(JSON.stringify(summary, null, 2))
  if (errors.length || (requireComplete && summary.pending.length)) throw new Error('Teaching review evidence is incomplete; see pending entries and errors')
  return summary
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await auditTeachingReviews({ write: process.argv.includes('--write'), requireComplete: process.argv.includes('--require-complete'), quiet: process.argv.includes('--quiet') })
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

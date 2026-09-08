import { describe, expect, it } from 'vitest'
import { inspectTeaching } from '../scripts/audit-teaching-depth.mjs'

describe('teaching audit counts evidence honestly', () => {
  it('excludes fenced examples while retaining prose from lists and tables', () => {
    const result = inspectTeaching('# 老师\n\n- 学生\n\n| 概念 |\n|---|\n| 数据 |\n\n```text\n代码不算正文\n```')
    expect(result.chineseProse).toBe(8)
    expect(result.codeCharacters).toBe(6)
  })
  it('flags English-only diagrams, not bilingual diagrams or executable code', () => {
    const result = inspectTeaching('```text\nClient -> Gateway\n```\n\n```text\nClient（客户端） -> Gateway（网关）\n```\n\n```bash\ncurl -v http://localhost\n```')
    expect(result.englishMaps).toEqual(['Client -> Gateway'])
  })

  it('also reviews English branches inside a partially translated diagram', () => {
    const result = inspectTeaching('```text\n请求路径\n  -> Gateway\n  -> Service（业务服务）\n```\n\n```bash\necho Client -> Gateway\n```')
    expect(result.englishMaps).toEqual([])
    expect(result.englishMapLines).toEqual(['-> Gateway'])
  })

  it('does not treat comparison signs across paragraphs as an HTML element', () => {
    const result = inspectTeaching('版本应 < 4。\n\n# 老师带你\n\n阈值 > 0。')
    expect(result.teachingClues).toBe(true)
    expect(result.chineseProse).toBe(9)
  })

  it('retains same-line comparison prose and excludes only actual inline code', () => {
    expect(inspectTeaching('当 a<b 时老师先检查，再比较 c>d。').chineseProse).toBe(10)
    const result = inspectTeaching('阈值 `a<b` 需要检查，实际 `c>d` 可能异常。')
    expect(result.chineseProse).toBe(12)
    expect(result.codeCharacters).toBe(6)
  })

  it('counts visible link and HTML text without counting source tags, URLs or code', () => {
    const result = inspectTeaching('老师 `代码` [学生](https://example.com/不计网址)\n\n<div>课堂</div>')
    expect(result.chineseProse).toBe(6)
    expect(result.codeCharacters).toBe(2)
    expect(inspectTeaching('<!-- 老师带你检查 -->').chineseProse).toBe(0)
    expect(inspectTeaching('<!-- 老师带你检查 -->').teachingClues).toBe(false)
  })
})

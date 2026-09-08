import { readFile, readdir, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

// 字数是编辑提示，不是内容质量或实验真实性的自动认证。
export function inspectTeaching(raw) {
  const tokens = marked.lexer(raw.replace(/^\uFEFF/, ''))
  const prose = []
  const englishMaps = []
  const englishMapLines = []
  let codeCharacters = 0
  function visit(items) {
    for (const token of items) {
      if (token.type === 'code' || token.type === 'codespan') {
        codeCharacters += token.text.length
        if (token.type === 'code' && ['text', 'plaintext', 'mermaid', ''].includes(token.lang || '') &&
            /(?:->|→|├|└|-->|^\s*flowchart)/m.test(token.text)) {
          if (/[A-Za-z]{3}/.test(token.text) && !/\p{Script=Han}/u.test(token.text)) {
            englishMaps.push(token.text.split('\n')[0].trim().slice(0, 100))
          }
          // A translated title must not hide untranslated branches below it.
          // Command/output examples may also match, so these remain review hints.
          englishMapLines.push(...token.text.split('\n').filter(line =>
            /(?:->|→|├|└|-->)/.test(line) && /[A-Za-z]{3}/.test(line) &&
            !/\p{Script=Han}/u.test(line)).map(line => line.trim().slice(0, 160)))
        }
      } else if (token.type === 'list') {
        token.items.forEach(item => visit(item.tokens))
      } else if (token.type === 'blockquote') {
        visit(token.tokens)
      } else if (token.type === 'table') {
        for (const row of [token.header, ...token.rows]) {
          for (const cell of row) visit(cell.tokens || [{ type: 'text', text: cell.text }])
        }
      } else if (token.type === 'html') {
        // Only strip tags the Markdown parser has identified as HTML. A prose
        // comparison such as a<b ... c>d must never erase the text between it.
        prose.push(token.text.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ''))
      } else if (Array.isArray(token.tokens)) {
        visit(token.tokens)
      } else if ('text' in token) {
        prose.push(token.text)
      }
    }
  }
  visit(tokens)
  const text = prose.join('\n')
    .replace(/https?:\/\/\S+/g, '')
  const chineseProse = (text.match(/\p{Script=Han}/gu) || []).length
  return {
    chineseProse,
    proseCharacters: text.replace(/\s/g, '').length,
    codeCharacters,
    englishMaps,
    englishMapLines,
    teachingClues: /老师|同学|课堂|我们一起|带你|你先|暂停一下/.test(text),
    foundationClues: /基础实验|入门实验|最小实验|入门练习|基础练习/.test(text),
    faultClues: /故障实验|故障注入|生产模拟|故障演练|桌面演练|故障.{0,16}(?:练习|模拟|实验)|失败.{0,12}(?:练习|实验)/.test(text),
    interviewClues: /30\s*秒/.test(text) && /3\s*分钟|三分钟/.test(text),
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(resolve(dir, entry.name))
    : entry.name.endsWith('.md') ? [resolve(dir, entry.name)] : []))).flat()
}

export async function auditTeaching({ write = false, quiet = false } = {}) {
  const root = resolve('docs/tech-stack')
  const files = (await walk(root)).filter(file => relative(root, file).includes('\\') || relative(root, file).includes('/'))
  const rows = await Promise.all(files.map(async file => {
    const raw = await readFile(file, 'utf8')
    const title = raw.replace(/^\uFEFF/, '').match(/^#\s+(.+)$/m)?.[1] || relative(root, file)
    return { path: relative(root, file).replaceAll('\\', '/'), title, ...inspectTeaching(raw) }
  }))
  rows.sort((a, b) => a.path.localeCompare(b.path))
  if (write) {
    const count = rows.filter(row => row.chineseProse >= 10000).length
    const output = [
      '# 全站老师带学修订与篇幅复核',
      '',
      '这张表来自实际文章内容，帮助你看到每篇的篇幅和继续补强的方向。正文汉字数排除代码、终端输出和文字图；英文术语不折算成汉字。数字达到目标只说明篇幅，不证明内容已经掌握或通过人工终审。',
      '',
      `当前纳入 ${rows.length} 篇技术栈，${count} 篇中文正文不少于 10,000 字。其余文章仍应结合知识深度继续扩写，不能把这一轮修订描述成每篇都已完成万字目标。`,
      '',
      `中文正文合计 ${rows.reduce((sum, row) => sum + row.chineseProse, 0).toLocaleString('en-US')} 汉字，${rows.filter(row => row.chineseProse >= 8000).length} 篇不少于 8,000 字。正文总字符包含中文、英文和数字但排除空白；代码与图字符另列，不用于补足正文目标。`,
      '',
      '“结构线索待复核”是关键词扫描提示：出现对应词语不等于实验已执行；没有对应词语也不必然缺内容。英文图及图内英文分支行分别检查，避免只翻译标题就掩盖下级术语；提示仍需人工区分知识地图、合法命令和样例输出，并检查紧邻正文是否已有准确解释。学习路线、面试模块与模板另按能否指导行动复核，不强行套用万字篇幅。',
      '',
      '| 技术栈 | 中文正文汉字 | 正文总字符 | 代码与图字符 | 目标差额 | 结构线索待复核 |',
      '|---|---:|---:|---:|---:|---|',
      ...rows.map(row => {
        const gaps = [!row.teachingClues && '带学语气', !row.foundationClues && '基础实验',
          !row.faultClues && '故障演练', !row.interviewClues && '分层口述',
          row.englishMaps.length > 0 && `英文图 ${row.englishMaps.length} 处`,
          row.englishMapLines.length > 0 && `图内英文行 ${row.englishMapLines.length} 处`].filter(Boolean)
        return `| [${row.title}](./${row.path}) | ${row.chineseProse.toLocaleString('en-US')} | ${row.proseCharacters.toLocaleString('en-US')} | ${row.codeCharacters.toLocaleString('en-US')} | ${Math.max(0, 10000 - row.chineseProse).toLocaleString('en-US')} | ${gaps.join('、') || '人工复核机制、实验与答案'} |`
      }),
      '',
      '## 学生怎么自测',
      '',
      '选一篇文章，合上正文解释一个概念、独立重做基础实验、判断一个故障、说明一个设计取舍，再拿证据回答一次追问。若只能照抄命令，请回到机制章节；若只会背定义，请回到实验。实验日期、环境和实际输出要由执行者填写，不能把文中的预期结果当成自己的实测记录。',
      '',
    ].join('\n')
    await writeFile(resolve(root, 'teaching-coverage.md'), output, 'utf8')
  }
  const summary = { total: rows.length, atLeast10000: rows.filter(row => row.chineseProse >= 10000).length,
    below10000: rows.filter(row => row.chineseProse < 10000).map(row => ({ path: row.path, chineseProse: row.chineseProse })),
    englishMaps: rows.filter(row => row.englishMaps.length).map(row => ({ path: row.path, maps: row.englishMaps })),
    englishMapLines: rows.filter(row => row.englishMapLines.length).map(row => ({ path: row.path, lines: row.englishMapLines })),
  }
  if (!quiet) console.log(JSON.stringify(summary, null, 2))
  return summary
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await auditTeaching({ write: process.argv.includes('--write'), quiet: process.argv.includes('--quiet') })
}

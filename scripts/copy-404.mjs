import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const indexPath = resolve('dist/index.html')
const notFoundPath = resolve('dist/404.html')

await mkdir(dirname(notFoundPath), { recursive: true })
await copyFile(indexPath, notFoundPath)

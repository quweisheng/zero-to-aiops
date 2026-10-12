export const sectionByPrefix: string[][]
export function normalizeDocPath(path: string): string
export function normalizeRoute(route: string): string
export function docImportPath(rootDir: string, filePath: string): string
export function sectionForRoute(route: string): string
export function extractTitle(raw: string): string
export function plainTextFromMarkdown(raw: string): string
export function excerptFromMarkdown(raw: string, title: string): string

export interface SearchDocument {
  route: string
  title: string
  section: string
  excerpt: string
  text: string
}

export interface SearchResult extends SearchDocument {
  score: number
}

export function searchDocs(
  query: string,
  index: SearchDocument[],
  limit = 8
): SearchResult[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (terms.length === 0) {
    return []
  }

  return index
    .map((doc) => ({
      ...doc,
      score: scoreDocument(doc, terms)
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-CN'))
    .slice(0, limit)
}

export async function fetchSearchIndex(
  searchIndexUrl: string,
  fetcher: typeof fetch = fetch
): Promise<SearchDocument[]> {
  const response = await fetcher(searchIndexUrl)
  if (!response.ok) {
    throw new Error(`Search index request failed: ${response.status}`)
  }

  return response.json() as Promise<SearchDocument[]>
}

function scoreDocument(doc: SearchDocument, terms: string[]): number {
  const title = doc.title.toLowerCase()
  const section = doc.section.toLowerCase()
  const excerpt = doc.excerpt.toLowerCase()
  const text = doc.text.toLowerCase()

  return terms.reduce((score, term) => {
    if (title.includes(term)) {
      return score + 20
    }
    if (section.includes(term)) {
      return score + 10
    }
    if (excerpt.includes(term)) {
      return score + 6
    }
    if (text.includes(term)) {
      return score + 2
    }
    return score
  }, 0)
}

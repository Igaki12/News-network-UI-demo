import type { Article, GraphEdgeInput, GraphNodeInput, GraphPayload, NodeMeta, QuizQuestion } from '../types'

const palette = [
  '#f8e8e8',
  '#fde4ec',
  '#ffe8e0',
  '#fff4da',
  '#f5f2d8',
  '#eaf7d5',
  '#dbf1e4',
  '#e5f6f9',
  '#e6f0ff',
  '#ece5ff',
  '#efe6f5',
  '#f7e8ef',
  '#f0f7ff',
  '#e8fff4',
  '#fff0f0',
  '#f4f9e8',
]

const logValue = (count: number) => {
  if (!count || count <= 1) return 2
  return Math.log(count) * 5 + 2
}

const keyPair = (a: string, b: string) => (a < b ? `${a}|||${b}` : `${b}|||${a}`)

const hash = (str: string) => {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i)
  }
  return h
}

const colorForSubject = (code?: string | null) => {
  if (!code) return '#f0f0f0'
  const idx = Math.abs(hash(code)) % palette.length
  return palette[idx]
}

const borderFor = (bg: string) => {
  const r = parseInt(bg.slice(1, 3), 16)
  const g = parseInt(bg.slice(3, 5), 16)
  const b = parseInt(bg.slice(5, 7), 16)
  const factor = 0.82
  const toHex = (v: number) => Math.floor(v * factor).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export const formatDateId = (dateId: string) => {
  if (dateId.length !== 8) return dateId
  return `${dateId.slice(0, 4)}-${dateId.slice(4, 6)}-${dateId.slice(6, 8)}`
}

export const parseJsonlArticles = (text: string): Article[] => {
  const lines = text.split(/\r?\n/)
  const parsed: Article[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const obj = JSON.parse(line)
      if (obj?.date_id && Array.isArray(obj?.named_entities) && typeof obj?.content === 'string') {
        parsed.push({
          ...obj,
          date_id: obj.date_id.toString(),
        })
      }
    } catch (err) {
      console.warn('JSON parse error', err)
    }
  }
  return parsed
}

export const groupArticlesByDate = (articles: Article[]) => {
  const byDate: Record<string, Article[]> = {}
  for (const article of articles) {
    const key = article.date_id.toString()
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(article)
  }
  const dates = Object.keys(byDate).sort()
  return { byDate, dates }
}

export const buildGraphPayload = (articles: Article[]) => {
  const entityCount = new Map<string, number>()
  const entitySubjectCounts = new Map<string, Map<string, number>>()
  const articleLookup = new Map<string, Article[]>()

  articles.forEach((article) => {
    const uniqueEntities = Array.from(new Set(article.named_entities)).filter(Boolean)
    uniqueEntities.forEach((entity) => {
      entityCount.set(entity, (entityCount.get(entity) || 0) + 1)
      if (!articleLookup.has(entity)) {
        articleLookup.set(entity, [])
      }
      articleLookup.get(entity)!.push(article)

      if (Array.isArray(article.subject_codes)) {
        const subjectMap = entitySubjectCounts.get(entity) ?? new Map<string, number>()
        article.subject_codes.forEach((subject) => {
          const matter = subject?.subject_matter
          if (!matter) return
          subjectMap.set(matter, (subjectMap.get(matter) || 0) + 1)
        })
        entitySubjectCounts.set(entity, subjectMap)
      }
    })
  })

  const topEntities = Array.from(entityCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([entity]) => entity)

  const nodes: GraphNodeInput[] = []
  const nodeMeta: Record<string, NodeMeta> = {}

  topEntities.forEach((entity) => {
    const subjectMap = entitySubjectCounts.get(entity)
    let dominantSubject: string | null = null
    let max = 0
    if (subjectMap) {
      for (const [subject, count] of subjectMap.entries()) {
        if (count > max) {
          max = count
          dominantSubject = subject
        }
      }
    }
    const bgColor = colorForSubject(dominantSubject)
    const count = entityCount.get(entity) ?? 0
    nodes.push({
      id: entity,
      label: `<b>${entity}</b>`,
      value: logValue(count),
      title: `出現回数: ${count}`,
      color: { background: bgColor, border: borderFor(bgColor) },
    })

    const relatedArticles =
      articleLookup
        .get(entity)
        ?.filter((a) => typeof a.content === 'string' && a.content.length > 50) ?? []

    const sortedByLength = relatedArticles
      .slice()
      .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))

    nodeMeta[entity] = {
      id: entity,
      count,
      subject: dominantSubject,
      articles: sortedByLength,
    }
  })

  const topSet = new Set(topEntities)
  const edgeCounts = new Map<string, number>()

  articles.forEach((article) => {
    const entities = Array.from(new Set(article.named_entities)).filter((entity) => topSet.has(entity))
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const key = keyPair(entities[i], entities[j])
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1)
      }
    }
  })

  const edges: GraphEdgeInput[] = Array.from(edgeCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([pair, count]) => {
      const [from, to] = pair.split('|||')
      return {
        from,
        to,
        value: count,
        title: `共起回数: ${count}`,
      }
    })

  const graph: GraphPayload = { nodes, edges }
  return { graph, nodeMeta }
}

export const shuffleArray = <T,>(items: T[]) => {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

type RawQuestion = {
  question?: string
  choices?: string[]
}

export const normalizeMultipleChoiceQuestion = (raw?: RawQuestion): QuizQuestion | null => {
  if (!raw || typeof raw.question !== 'string') return null
  if (!Array.isArray(raw.choices) || raw.choices.length === 0) return null
  const cleaned = raw.choices.filter((choice) => typeof choice === 'string' && choice.trim().length > 0)
  if (cleaned.length === 0) return null
  const choices = cleaned.map((text, idx) => ({
    id: `${idx}-${text}`,
    text,
    isCorrect: idx === 0,
  }))
  return {
    prompt: raw.question,
    choices,
    correctText: cleaned[0],
  }
}

export const pickFeaturedArticle = (articles: Article[], excludeId?: string | null) => {
  const pool = articles.filter((article) => {
    if (!article.content || article.content.length <= 50) return false
    if (excludeId && article.news_item_id === excludeId) return false
    return true
  })
  if (pool.length === 0) return null
  const sorted = pool.slice().sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))
  const topK = Math.min(5, sorted.length)
  const idx = Math.floor(Math.random() * topK)
  return sorted[idx]
}

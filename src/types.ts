export type Article = {
  date_id: string
  named_entities: string[]
  content: string
  headline?: string
  subject_codes?: Array<{ subject_matter?: string }>
  questions?: Array<{ question: string; choices: string[] }>
  news_item_id?: string
}

export type GraphNodeInput = {
  id: string
  label: string
  value: number
  title: string
  color: {
    background: string
    border: string
  }
}

export type GraphEdgeInput = {
  from: string
  to: string
  value: number
  title: string
}

export type GraphPayload = {
  nodes: GraphNodeInput[]
  edges: GraphEdgeInput[]
}

export type NodeMeta = {
  id: string
  count: number
  subject?: string | null
  articles: Article[]
}

export type QuizChoice = {
  id: string
  text: string
  isCorrect: boolean
}

export type QuizQuestion = {
  prompt: string
  choices: QuizChoice[]
  correctText: string
}

export type CbtQuestion = QuizQuestion & {
  id: string
  article: Article
}

import { Box } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import type { Article, GraphPayload, NodeMeta, QuizQuestion } from './types'
import {
  buildGraphPayload,
  formatDateId,
  groupArticlesByDate,
  normalizeMultipleChoiceQuestion,
  parseJsonlArticles,
  pickFeaturedArticle,
} from './utils/data'
import { ArticleModal } from './components/ArticleModal'
import { FooterBadge } from './components/FooterBadge'
import { NetworkCanvas } from './components/NetworkCanvas'
import { NodeDetailsCard } from './components/NodeDetailsCard'
import { RandomQuizModal } from './components/RandomQuizModal'
import { TopLeftPanel } from './components/TopLeftPanel'

type ArticleModalPayload = {
  nodeId: string
  article: Article
  related: Article[]
}

type RandomState = {
  article: Article
  question: QuizQuestion
}

const fmt = new Intl.NumberFormat('ja-JP')
const SAMPLE_FILE_PATH = `${import.meta.env.BASE_URL}news_full_mcq3_type9_entities_novectors.jsonl`

function App() {
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [articlesByDate, setArticlesByDate] = useState<Record<string, Article[]>>({})
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [currentDateIndex, setCurrentDateIndex] = useState(-1)
  const [graphData, setGraphData] = useState<GraphPayload | null>(null)
  const [nodeMeta, setNodeMeta] = useState<Record<string, NodeMeta>>({})
  const [details, setDetails] = useState<string[]>([])
  const [articleModalData, setArticleModalData] = useState<ArticleModalPayload | null>(null)
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set())
  const [randomState, setRandomState] = useState<RandomState | null>(null)
  const [isRandomModalOpen, setRandomModalOpen] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const hasData = availableDates.length > 0
  const currentDate = hasData && currentDateIndex >= 0 ? availableDates[currentDateIndex] : null

  useEffect(() => {
    if (!currentDate) {
      setGraphData(null)
      setNodeMeta({})
      return
    }
    const articles = articlesByDate[currentDate] || []
    const { graph, nodeMeta } = buildGraphPayload(articles)
    setGraphData(graph)
    setNodeMeta(nodeMeta)
  }, [articlesByDate, currentDate])

  const applyParsedArticles = useCallback((parsed: Article[]) => {
    const { byDate, dates } = groupArticlesByDate(parsed)
    if (dates.length === 0) {
      window.alert('有効な日付のデータが見つかりませんでした。')
      return false
    }
    setAllArticles(parsed)
    setArticlesByDate(byDate)
    setAvailableDates(dates)
    setCurrentDateIndex(dates.length - 1)
    setCompletedNodes(new Set())
    setDetails([])
    setArticleModalData(null)
    return true
  }, [])

  const loadArticlesFromText = useCallback(
    (text: string) => {
      const parsed = parseJsonlArticles(text)
      if (parsed.length === 0) {
        window.alert('有効なデータが含まれるJSONLファイルではありません。date_id, named_entities, contentが必要です。')
        return false
      }
      return applyParsedArticles(parsed)
    },
    [applyParsedArticles],
  )

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsLoadingData(true)
      try {
        const text = await file.text()
        loadArticlesFromText(text)
      } finally {
        setIsLoadingData(false)
      }
    },
    [loadArticlesFromText],
  )

  const handleUseProvidedFile = useCallback(async () => {
    setIsLoadingData(true)
    try {
      const response = await fetch(SAMPLE_FILE_PATH)
      if (!response.ok) {
        throw new Error('failed to load sample file')
      }
      const text = await response.text()
      loadArticlesFromText(text)
    } catch (err) {
      console.error(err)
      window.alert('用意されているファイルを読み込めませんでした。時間をおいてから再度お試しください。')
    } finally {
      setIsLoadingData(false)
    }
  }, [loadArticlesFromText])

  const getArticlesForNode = useCallback(
    (nodeId: string) =>
      allArticles.filter(
        (article) =>
          Array.isArray(article.named_entities) &&
          article.named_entities.includes(nodeId) &&
          typeof article.content === 'string' &&
          article.content.length > 50,
      ),
    [allArticles],
  )

  const handleNodeClick = useCallback(
    (nodeId: string | null) => {
      if (!nodeId) {
        setDetails([])
        setArticleModalData(null)
        return
      }
      const meta = nodeMeta[nodeId]
      const infoLine = meta ? `${nodeId}: 出現回数 ${fmt.format(meta.count)}` : nodeId
      const detailLines = [infoLine]
      const pool = getArticlesForNode(nodeId)

      if (pool.length === 0) {
        detailLines.push('詳細な関連記事が見つかりませんでした。')
        setArticleModalData(null)
      } else {
        const article = pickFeaturedArticle(pool) ?? pool[0]
        setArticleModalData({ nodeId, article, related: pool })
      }
      setDetails(detailLines)
    },
    [getArticlesForNode, nodeMeta],
  )

  const handlePrevDate = () => {
    setDetails([])
    setArticleModalData(null)
    setCurrentDateIndex((idx) => Math.max(0, idx - 1))
  }

  const handleNextDate = () => {
    setDetails([])
    setArticleModalData(null)
    setCurrentDateIndex((idx) => Math.min(availableDates.length - 1, idx + 1))
  }

  const handleQuizSuccess = (nodeId: string) => {
    setCompletedNodes((prev) => {
      const next = new Set(prev)
      next.add(nodeId)
      return next
    })
  }

  const handleRandomQuestion = () => {
    if (!currentDate) {
      window.alert('日付を選択してください。')
      return
    }
    const candidates = (articlesByDate[currentDate] || []).filter((article) => Array.isArray(article.questions) && article.questions.length > 0)
    if (candidates.length === 0) {
      window.alert('この日付には出題できる問題がありません。')
      return
    }
    const article = candidates[Math.floor(Math.random() * candidates.length)]
    const rawQuestion = article.questions![Math.floor(Math.random() * article.questions!.length)]
    const normalized = normalizeMultipleChoiceQuestion(rawQuestion || undefined)
    if (!normalized) {
      window.alert('この問題は選択肢を表示できません。別の問題をお試しください。')
      return
    }
    setRandomState({ article, question: normalized })
    setRandomModalOpen(true)
  }

  const handleRandomOpenArticle = () => {
    if (!randomState) return
    const fallback =
      (Array.isArray(randomState.article.named_entities) && randomState.article.named_entities[0]) ||
      randomState.article.headline ||
      'ランダム記事'
    const pool = getArticlesForNode(fallback)
    const related = pool.length > 0 ? pool.slice() : []
    const hasArticleId =
      randomState.article.news_item_id &&
      related.some((article) => article.news_item_id === randomState.article.news_item_id)
    const hasSameRef = related.some((article) => article === randomState.article)
    if (!hasArticleId && !hasSameRef) {
      related.unshift(randomState.article)
    }
    setArticleModalData({
      nodeId: fallback,
      article: randomState.article,
      related,
    })
  }

  const closeRandomModal = () => {
    setRandomModalOpen(false)
  }

  const articleModalNodeId = articleModalData?.nodeId ?? null
  const articleModalArticle = articleModalData?.article ?? null
  const articleModalRelated = articleModalData?.related ?? []

  return (
    <Box minH="100dvh">
      <NetworkCanvas data={graphData} onNodeClick={handleNodeClick} completedNodes={completedNodes} />
      <TopLeftPanel
        hasData={hasData}
        onFileSelected={handleFileSelected}
        currentDateDisplay={currentDate ? formatDateId(currentDate) : 'YYYY-MM-DD'}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        disablePrev={!hasData || currentDateIndex === 0}
        disableNext={!hasData || currentDateIndex === availableDates.length - 1}
        onRandomQuestion={handleRandomQuestion}
        onUseProvidedFile={handleUseProvidedFile}
        isLoading={isLoadingData}
      />
      <NodeDetailsCard isVisible={hasData} details={details} />
      <ArticleModal
        isOpen={Boolean(articleModalData)}
        nodeId={articleModalNodeId}
        article={articleModalArticle}
        relatedArticles={articleModalRelated}
        onClose={() => setArticleModalData(null)}
        onQuizSuccess={handleQuizSuccess}
      />
      <RandomQuizModal
        isOpen={isRandomModalOpen}
        question={randomState?.question ?? null}
        onClose={closeRandomModal}
        onOpenArticle={() => {
          closeRandomModal()
          handleRandomOpenArticle()
        }}
      />
      <FooterBadge />
    </Box>
  )
}

export default App

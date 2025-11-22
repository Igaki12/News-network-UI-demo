import { Box } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Article, AuthResult, AuthUser, CbtQuestion, DemoAccount, GraphPayload, NodeMeta, QuizQuestion } from './types'
import {
  buildGraphPayload,
  formatDateId,
  groupArticlesByDate,
  normalizeMultipleChoiceQuestion,
  parseJsonlArticles,
  pickFeaturedArticle,
  shuffleArray,
} from './utils/data'
import { AUTH_GROUPS, SAMPLE_ACCOUNTS } from './data/auth'
import { AuthLanding } from './components/AuthLanding'
import { AuthModal } from './components/AuthModal'
import { ArticleModal } from './components/ArticleModal'
import { CbtExamOverlay } from './components/CbtExamOverlay'
import { FooterBadge } from './components/FooterBadge'
import { NetworkCanvas } from './components/NetworkCanvas'
import { NodeDetailsCard } from './components/NodeDetailsCard'
import { RandomQuizModal } from './components/RandomQuizModal'
import { TopLeftPanel } from './components/TopLeftPanel'
import { UserProfileButton } from './components/UserProfileButton'

type ArticleModalPayload = {
  nodeId: string
  article: Article
  related: Article[]
}

type RandomState = {
  article: Article
  question: QuizQuestion
  entityId: string
}

const fmt = new Intl.NumberFormat('ja-JP')
const SAMPLE_FILE_PATH = `${import.meta.env.BASE_URL}news_full_mcq3_type9_entities_novectors.jsonl`
const FALLBACK_GROUP_ID = AUTH_GROUPS[0]?.id ?? 1
function App() {
  const [knownUsers, setKnownUsers] = useState<DemoAccount[]>(SAMPLE_ACCOUNTS)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
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
  const [maxNodes] = useState(40)
  const [isCbtMode, setCbtMode] = useState(false)
  const [cbtQuestions, setCbtQuestions] = useState<CbtQuestion[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [isAuthModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn')

  const isAuthenticated = Boolean(currentUser)

  const hasData = availableDates.length > 0
  const currentDate = hasData && currentDateIndex >= 0 ? availableDates[currentDateIndex] : null

  const dateIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    availableDates.forEach((date, index) => {
      map.set(date, index)
    })
    return map
  }, [availableDates])

  useEffect(() => {
    if (!currentDate) {
      setGraphData(null)
      setNodeMeta({})
      return
    }
    const articles = articlesByDate[currentDate] || []
    // Node count cap: 40 for desktop, 20 for <=720px screens (requested behavior)
    const { graph, nodeMeta } = buildGraphPayload(articles, maxNodes)
    setGraphData(graph)
    setNodeMeta(nodeMeta)
  }, [articlesByDate, currentDate, maxNodes])

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
    setCbtMode(false)
    setCbtQuestions([])
    setSelectedNodeIds([])
    return true
  }, [])

  const resetWorkspace = useCallback(() => {
    setAllArticles([])
    setArticlesByDate({})
    setAvailableDates([])
    setCurrentDateIndex(-1)
    setGraphData(null)
    setNodeMeta({})
    setDetails([])
    setArticleModalData(null)
    setCompletedNodes(new Set())
    setRandomState(null)
    setRandomModalOpen(false)
    setCbtMode(false)
    setCbtQuestions([])
    setSelectedNodeIds([])
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
    (nodeId: string | null, options?: { suppressModal?: boolean; skipSelection?: boolean }) => {
      if (!nodeId) {
        if (!options?.skipSelection) {
          setSelectedNodeIds([])
        }
        setDetails([])
        if (!options?.suppressModal) {
          setArticleModalData(null)
        }
        return
      }
      if (!options?.skipSelection) {
        setSelectedNodeIds([nodeId])
      }
      const meta = nodeMeta[nodeId]
      const infoLine = meta ? `${nodeId}: 出現回数 ${fmt.format(meta.count)}` : nodeId
      const detailLines = [infoLine]
      const pool = getArticlesForNode(nodeId)

      if (pool.length === 0) {
        detailLines.push('詳細な関連記事が見つかりませんでした。')
        if (!options?.suppressModal) {
          setArticleModalData(null)
        }
      } else {
        if (!options?.suppressModal) {
          const article = pickFeaturedArticle(pool) ?? pool[0]
          setArticleModalData({ nodeId, article, related: pool })
        }
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

  const handleSelectDate = useCallback(
    (dateId: string) => {
      const targetIndex = dateIndexMap.get(dateId)
      if (typeof targetIndex !== 'number') return
      setDetails([])
      setArticleModalData(null)
      setCurrentDateIndex(targetIndex)
    },
    [dateIndexMap],
  )

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
    const metas = Object.values(nodeMeta).filter((meta) =>
      meta.articles.some((article) => Array.isArray(article.questions) && article.questions.length > 0),
    )
    if (metas.length === 0) {
      window.alert('この日付には出題できる問題がありません。')
      return
    }
    const shuffledMetas = shuffleArray(metas)
    let selection: { article: Article; normalized: QuizQuestion; entityId: string } | null = null
    for (const meta of shuffledMetas) {
      const articlesWithQuestions = meta.articles.filter((article) => Array.isArray(article.questions) && article.questions.length > 0)
      if (articlesWithQuestions.length === 0) continue
      const prioritized = articlesWithQuestions.length > 5 ? articlesWithQuestions.slice(0, 5) : articlesWithQuestions
      const articlePool = shuffleArray(prioritized)
      let found = false
      for (const article of articlePool) {
        const questionPool = shuffleArray(article.questions ?? [])
        for (const rawQuestion of questionPool) {
          const normalized = normalizeMultipleChoiceQuestion(rawQuestion || undefined)
          if (normalized) {
            selection = { article, normalized, entityId: meta.id }
            found = true
            break
          }
        }
        if (found) break
      }
      if (selection) break
    }
    if (!selection) {
      window.alert('この日付には出題できる問題がありません。')
      return
    }
    setRandomState({ article: selection.article, question: selection.normalized, entityId: selection.entityId })
    setRandomModalOpen(true)
  }

  const prepareCbtQuestions = useCallback(() => {
    if (!currentDate) {
      window.alert('日付を選択してください。')
      return null
    }

    const metaList = Object.values(nodeMeta)
    if (metaList.length === 0) {
      window.alert('この日付ではグラフに表示できるエンティティがありません。')
      return null
    }

    const metasWithQuestions = metaList.filter((meta) =>
      meta.articles.some((article) => Array.isArray(article.questions) && article.questions.length > 0),
    )
    if (metasWithQuestions.length === 0) {
      window.alert('この日付では出題できる問題が見つかりませんでした。')
      return null
    }

    const pickQuestionForEntity = (meta: NodeMeta) => {
      const articlesWithQuestions = meta.articles.filter(
        (article) => Array.isArray(article.questions) && article.questions.length > 0,
      )
      if (articlesWithQuestions.length === 0) return null
      const prioritized = articlesWithQuestions.length > 5 ? articlesWithQuestions.slice(0, 5) : articlesWithQuestions
      const articlePool = shuffleArray(prioritized)
      for (const article of articlePool) {
        const shuffledQuestions = shuffleArray(article.questions ?? [])
        for (const rawQuestion of shuffledQuestions) {
          const normalized = normalizeMultipleChoiceQuestion(rawQuestion || undefined)
          if (normalized) {
            return { article, normalized }
          }
        }
      }
      return null
    }

    const shuffledMetas = shuffleArray(metasWithQuestions)
    const selected: CbtQuestion[] = []
    let counter = 0
    for (const meta of shuffledMetas) {
      if (selected.length >= 10) break
      const chosen = pickQuestionForEntity(meta)
      if (!chosen) continue
      const { article, normalized } = chosen
      selected.push({
        id: `cbt-${meta.id}-${counter}`,
        prompt: normalized.prompt,
        choices: shuffleArray(normalized.choices),
        correctText: normalized.correctText,
        article,
        entityId: meta.id,
      })
      counter += 1
    }

    if (selected.length < 10) {
      window.alert('この日付ではCBTに必要な10問を準備できません。')
      return null
    }

    return selected
  }, [currentDate, nodeMeta])

  const handleStartCbt = useCallback(() => {
    const prepared = prepareCbtQuestions()
    if (!prepared) return
    setDetails([])
    setArticleModalData(null)
    setRandomModalOpen(false)
    setCbtQuestions(prepared)
    setCbtMode(true)
  }, [prepareCbtQuestions])

  const handleExitCbt = useCallback(
    (payload: { highlighted: string[]; glowing: string[] } | null) => {
      setCbtMode(false)
      setCbtQuestions([])
      if (!payload) {
        setSelectedNodeIds([])
        return
      }
      const uniqueHighlighted = Array.from(new Set(payload.highlighted))
      setSelectedNodeIds(uniqueHighlighted)
      if (uniqueHighlighted.length > 0) {
        setDetails([`CBTで出題された${uniqueHighlighted.length}件のノードをハイライトしています。`])
      }
      if (payload.glowing.length > 0) {
        setCompletedNodes((prev) => {
          const next = new Set(prev)
          payload.glowing.forEach((id) => next.add(id))
          return next
        })
      }
    },
    [],
  )

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

  const applyNodeGlow = useCallback((entityId: string) => {
    setCompletedNodes((prev) => {
      const next = new Set(prev)
      next.add(entityId)
      return next
    })
  }, [])

  const toAuthUser = useCallback((account: DemoAccount): AuthUser => {
    const { email, displayName, groupId, roleInGroup } = account
    return { email, displayName, groupId, roleInGroup }
  }, [])

  const handleSignIn = useCallback(
    async ({ email, password }: { email: string; password: string }): Promise<AuthResult> => {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        return { success: false, message: 'メールアドレスを入力してください。' }
      }
      const match = knownUsers.find((user) => user.email.toLowerCase() === normalizedEmail)
      if (match) {
        const user = toAuthUser(match)
        setCurrentUser(user)
        return { success: true, user }
      }
      // ダミー環境なので、未登録でも即座に通過させ既定グループへ仮配属する
      const inferredName = normalizedEmail.split('@')[0] || 'Guest User'
      const newAccount: DemoAccount = {
        email: normalizedEmail,
        password,
        displayName: inferredName,
        groupId: FALLBACK_GROUP_ID,
        roleInGroup: 'member',
      }
      setKnownUsers((prev) => [...prev, newAccount])
      const user = toAuthUser(newAccount)
      setCurrentUser(user)
      return { success: true, user }
    },
    [knownUsers, toAuthUser],
  )

  const handleSignUp = useCallback(
    async (payload: {
      displayName: string
      email: string
      password: string
      groupId: number
      roleInGroup: string
      verificationCode?: string
    }): Promise<AuthResult> => {
      const normalizedEmail = payload.email.trim().toLowerCase()
      if (!normalizedEmail) {
        return { success: false, message: 'メールアドレスを入力してください。' }
      }
      if (!payload.displayName) {
        return { success: false, message: '表示名を入力してください。' }
      }
      const exists = knownUsers.some((user) => user.email.toLowerCase() === normalizedEmail)
      if (exists) {
        return { success: false, message: 'すでに登録済みのメールアドレスです。' }
      }
      const newAccount: DemoAccount = {
        email: normalizedEmail,
        password: payload.password,
        displayName: payload.displayName,
        groupId: payload.groupId,
        roleInGroup: payload.roleInGroup,
      }
      setKnownUsers((prev) => [...prev, newAccount])
      const user = toAuthUser(newAccount)
      setCurrentUser(user)
      return { success: true, user }
    },
    [knownUsers, toAuthUser],
  )

  const openSignIn = () => {
    setAuthMode('signIn')
    setAuthModalOpen(true)
  }

  const openSignUp = () => {
    setAuthMode('signUp')
    setAuthModalOpen(true)
  }

  const handleLogout = useCallback(() => {
    resetWorkspace()
    setCurrentUser(null)
  }, [resetWorkspace])

  const handleRandomQuestionResult = useCallback(
    (entityId: string | null, isCorrect: boolean) => {
      if (!entityId) return
      handleNodeClick(entityId, { suppressModal: true, skipSelection: true })
      setSelectedNodeIds((prev) => {
        const next = new Set(prev)
        next.add(entityId)
        return Array.from(next)
      })
      if (isCorrect) {
        applyNodeGlow(entityId)
      }
    },
    [applyNodeGlow, handleNodeClick],
  )

  const articleModalNodeId = articleModalData?.nodeId ?? null
  const articleModalArticle = articleModalData?.article ?? null
  const articleModalRelated = articleModalData?.related ?? []
  const randomDateLabel = randomState?.article?.date_id
    ? formatDateId(randomState.article.date_id)
    : currentDate
      ? formatDateId(currentDate)
      : 'YYYY-MM-DD'
  const randomHeadline = randomState
    ? randomState.article.headline || randomState.entityId || randomState.article.named_entities?.[0] || '関連ニュース'
    : '関連ニュース'

  return (
    <Box minH="100dvh">
      {isAuthenticated && !isCbtMode && (
        <>
          <NetworkCanvas
            data={graphData}
            onNodeClick={handleNodeClick}
            completedNodes={completedNodes}
            selectedNodeIds={selectedNodeIds}
          />
          <TopLeftPanel
            hasData={hasData}
            onFileSelected={handleFileSelected}
            currentDateDisplay={currentDate ? formatDateId(currentDate) : 'YYYY-MM-DD'}
            onPrevDate={handlePrevDate}
            onNextDate={handleNextDate}
            onSelectDate={handleSelectDate}
            disablePrev={!hasData || currentDateIndex === 0}
            disableNext={!hasData || currentDateIndex === availableDates.length - 1}
            onRandomQuestion={handleRandomQuestion}
            onUseProvidedFile={handleUseProvidedFile}
            isLoading={isLoadingData}
            onStartCbt={handleStartCbt}
            availableDates={availableDates}
            currentDateId={currentDate}
          />
          <NodeDetailsCard isVisible={hasData} details={details} hasGlowingNodes={completedNodes.size > 0} />
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
            onResult={(result) => handleRandomQuestionResult(randomState?.entityId ?? null, result)}
            currentDateLabel={randomDateLabel}
            headline={randomHeadline}
          />
        </>
      )}
      {isAuthenticated && isCbtMode && cbtQuestions.length > 0 && (
        <CbtExamOverlay
          questions={cbtQuestions}
          onExit={handleExitCbt}
          currentDateLabel={currentDate ? formatDateId(currentDate) : 'YYYY-MM-DD'}
        />
      )}
      <FooterBadge hasData={isAuthenticated && hasData} />
      {!isAuthenticated && <AuthLanding onSignInClick={openSignIn} onSignUpClick={openSignUp} />}
      <AuthModal
        mode={authMode}
        isOpen={isAuthModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        onSignIn={handleSignIn}
        onSignUp={(payload) => handleSignUp(payload)}
        groups={AUTH_GROUPS}
      />
      {isAuthenticated && currentUser && (
        <UserProfileButton
          user={currentUser}
          groupName={AUTH_GROUPS.find((group) => group.id === currentUser.groupId)?.name}
          onLogout={handleLogout}
        />
      )}
    </Box>
  )
}

export default App

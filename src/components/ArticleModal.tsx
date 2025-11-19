import { CheckIcon, WarningTwoIcon } from '@chakra-ui/icons'
import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Article, QuizChoice, QuizQuestion } from '../types'
import { normalizeMultipleChoiceQuestion, pickFeaturedArticle, shuffleArray } from '../utils/data'

type Props = {
  isOpen: boolean
  nodeId: string | null
  article: Article | null
  relatedArticles: Article[]
  onClose: () => void
  onQuizSuccess: (nodeId: string) => void
}

type ViewState = 'article' | 'quiz' | 'result'

export const ArticleModal = ({ isOpen, nodeId, article, relatedArticles, onClose, onQuizSuccess }: Props) => {
  const [currentArticle, setCurrentArticle] = useState<Article | null>(article)
  const [view, setView] = useState<ViewState>('article')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizGood, setQuizGood] = useState(0)
  const [quizBad, setQuizBad] = useState(0)
  const [choicesLocked, setChoicesLocked] = useState(false)
  const [choiceStatus, setChoiceStatus] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isArticleVisibleInQuiz, setArticleVisibleInQuiz] = useState(false)
  const [resultMessage, setResultMessage] = useState<{ status: 'success' | 'warning'; text: string } | null>(null)

  const resetQuiz = useCallback(() => {
    setQuizQuestions([])
    setQuizIndex(0)
    setQuizGood(0)
    setQuizBad(0)
    setChoicesLocked(false)
    setChoiceStatus({})
    setFeedback(null)
    setArticleVisibleInQuiz(false)
    setResultMessage(null)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setCurrentArticle(article)
      resetQuiz()
      setView('article')
    } else {
      resetQuiz()
    }
  }, [article, isOpen, resetQuiz])

  const modalTitle = useMemo(() => {
    if (!nodeId) return '記事詳細'
    return `関連ニュース: ${nodeId}`
  }, [nodeId])

  const currentQuestion = quizQuestions[quizIndex]

  const handleReadAnother = () => {
    const next = pickFeaturedArticle(relatedArticles, currentArticle?.news_item_id ?? null)
    if (!next) {
      window.alert('他の記事が見つかりませんでした。')
      return
    }
    setCurrentArticle(next)
    resetQuiz()
    setView('article')
  }

  const handleStartQuiz = () => {
    if (!currentArticle) return
    const normalized = (currentArticle.questions || [])
      .map((q) => normalizeMultipleChoiceQuestion(q || undefined))
      .filter((q): q is QuizQuestion => Boolean(q))
    if (normalized.length === 0) {
      finishQuiz(true)
      return
    }
    setQuizQuestions(normalized)
    setQuizIndex(0)
    setQuizGood(0)
    setQuizBad(0)
    setFeedback(null)
    setChoiceStatus({})
    setChoicesLocked(false)
    setArticleVisibleInQuiz(false)
    setResultMessage(null)
    setView('quiz')
  }

  const handleChoiceSelection = (choice: QuizChoice) => {
    if (!currentQuestion || choicesLocked) return
    setChoicesLocked(true)
    const correctChoice = currentQuestion.choices.find((c) => c.isCorrect)

    setChoiceStatus({
      [choice.id]: choice.isCorrect ? 'correct' : 'incorrect',
      ...(correctChoice ? { [correctChoice.id]: 'correct' } : {}),
    })

    const correctText = currentQuestion.correctText
    const isCorrect = choice.isCorrect
    setFeedback(isCorrect ? '正解です！' : `正解は「${correctText}」です。`)
    if (isCorrect) {
      setQuizGood((prev) => prev + 1)
    } else {
      setQuizBad((prev) => prev + 1)
    }

    const currentIndex = quizIndex
    const total = quizQuestions.length
    setTimeout(() => {
      setChoiceStatus({})
      setFeedback(null)
      setChoicesLocked(false)
      if (currentIndex + 1 >= total) {
        finishQuiz()
      } else {
        setQuizIndex(currentIndex + 1)
      }
    }, 5000)
  }

  const finishQuiz = (forceSuccess = false) => {
    if (!nodeId) {
      onClose()
      return
    }
    const success = forceSuccess || quizGood >= quizBad
    setView('result')
    if (success) {
      setResultMessage({ status: 'success', text: '素晴らしい！他のテーマにも挑戦してみよう' })
      onQuizSuccess(nodeId)
      setTimeout(() => {
        onClose()
      }, 2000)
    } else {
      setResultMessage({ status: 'warning', text: 'もう少しです！別の記事で再挑戦しましょう。' })
      setTimeout(() => {
        const alternative = pickFeaturedArticle(relatedArticles, currentArticle?.news_item_id ?? null)
        if (alternative) {
          setCurrentArticle(alternative)
          resetQuiz()
          setView('article')
        } else {
          window.alert('別の関連記事が見つかりませんでした。')
          onClose()
        }
      }, 2500)
    }
  }

  const handleToggleArticle = () => {
    setArticleVisibleInQuiz((prev) => !prev)
  }

  const shuffledChoices = useMemo(() => {
    if (!currentQuestion) return []
    return shuffleArray(currentQuestion.choices)
  }, [currentQuestion])

  const shouldShowArticleView = view === 'article' || (view === 'quiz' && isArticleVisibleInQuiz)

  if (!isOpen || !currentArticle) {
    return null
  }

  const articleHeadline = currentArticle.headline || '見出しなし'

  return (
    <Box className={`modal ${isOpen ? 'visible' : ''}`}>
      <Box className="backdrop" onClick={onClose} />
      <Box className="dialog" role="dialog" aria-modal="true">
        <Box as="header" display="flex" justifyContent="space-between" alignItems="center" mb="14px">
          <Heading as="h2" id="modal-title" size="md" m={0}>
            {modalTitle}
          </Heading>
          <Button aria-label="閉じる" onClick={onClose} variant="ghost" size="sm">
            ✕
          </Button>
        </Box>
        <Box className="dialog-content">
          {shouldShowArticleView && (
            <Box id="article-view">
              <Heading as="h3" size="md" id="article-headline" mb={3}>
                {articleHeadline}
              </Heading>
              <Text id="article-content" whiteSpace="pre-wrap">
                {currentArticle.content}
              </Text>
              <Box id="article-actions" mt={0} style={{ display: view === 'article' ? 'block' : 'none' }}>
                <Button id="read-another-btn" className="btn-primary" marginRight="8px" type="button" onClick={handleReadAnother} mt={4}>
                  他の記事を読む
                </Button>
                <Button id="start-quiz-btn" className="btn-primary" type="button" onClick={handleStartQuiz} mt={4}>
                  理解度テストを始める
                </Button>
              </Box>
            </Box>
          )}

          {view === 'quiz' && (
            <Box id="quiz-view">
              <Text id="quiz-progress">
                問題 {quizIndex + 1} / {quizQuestions.length}
              </Text>
              <Text id="quiz-question" mt={2}>
                {currentQuestion?.prompt}
              </Text>
              <Box id="quiz-choices" className="choice-grid" data-locked={choicesLocked}>
                {shuffledChoices.map((choice) => (
                  <Button
                    key={choice.id}
                    type="button"
                    className={`choice-button ${choiceStatus[choice.id] ?? ''}`}
                    disabled={choicesLocked}
                    onClick={() => handleChoiceSelection(choice)}
                    variant="unstyled"
                    whiteSpace="normal"
                    height="auto"
                    textAlign="left"
                    lineHeight="1.5"
                  >
                    {choice.text}
                  </Button>
                ))}
              </Box>
              {feedback && (
                <Box id="quiz-feedback" className="answer-box">
                  {feedback}
                </Box>
              )}
              <Button
                id="toggle-article-btn"
                className="btn-primary"
                marginTop="40px"
                type="button"
                onClick={handleToggleArticle}
              >
                {isArticleVisibleInQuiz ? '記事を隠す' : '根拠となる記事を確認する'}
              </Button>
            </Box>
          )}

          {view === 'result' && resultMessage && (
            <Box id="quiz-result">
              <Box className="result-animation" display="flex" flexDirection="column" alignItems="center" gap={4}>
                <Box id="result-icon" display="flex" alignItems="center" justifyContent="center">
                  {resultMessage.status === 'success' ? (
                    <CheckIcon boxSize="56px" color="green.400" />
                  ) : (
                    <WarningTwoIcon boxSize="56px" color="orange.300" />
                  )}
                </Box>
                <Text id="result-text" textAlign="center">
                  {resultMessage.text}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

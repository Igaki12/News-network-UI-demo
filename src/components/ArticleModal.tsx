import { Box, Button } from '@chakra-ui/react'
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
  const [resultMessage, setResultMessage] = useState<{ icon: string; text: string } | null>(null)

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
    }, 1400)
  }

  const finishQuiz = (forceSuccess = false) => {
    if (!nodeId) {
      onClose()
      return
    }
    const success = forceSuccess || quizGood >= quizBad
    setView('result')
    if (success) {
      setResultMessage({ icon: '🎉', text: '素晴らしい！他のテーマにも挑戦してみよう' })
      onQuizSuccess(nodeId)
      setTimeout(() => {
        onClose()
      }, 2000)
    } else {
      setResultMessage({ icon: '🤔', text: 'もう少しです！別の記事で再挑戦しましょう。' })
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
        <header>
          <h2 id="modal-title">{modalTitle}</h2>
          <button className="close" aria-label="閉じる" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="dialog-content">
          {shouldShowArticleView && (
            <div id="article-view">
              <h3 id="article-headline">{articleHeadline}</h3>
              <p id="article-content">{currentArticle.content}</p>
              <div id="article-actions" style={{ display: view === 'article' ? 'block' : 'none' }}>
                <Button id="read-another-btn" className="btn-primary" marginRight="8px" type="button" onClick={handleReadAnother}>
                  他の記事を読む
                </Button>
                <Button id="start-quiz-btn" className="btn-primary" type="button" onClick={handleStartQuiz}>
                  理解度テストを始める
                </Button>
              </div>
            </div>
          )}

          {view === 'quiz' && (
            <div id="quiz-view">
              <p id="quiz-progress">
                問題 {quizIndex + 1} / {quizQuestions.length}
              </p>
              <p id="quiz-question">{currentQuestion?.prompt}</p>
              <div id="quiz-choices" className="choice-grid" data-locked={choicesLocked}>
                {shuffledChoices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className={`choice-button ${choiceStatus[choice.id] ?? ''}`}
                    disabled={choicesLocked}
                    onClick={() => handleChoiceSelection(choice)}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
              {feedback && (
                <div id="quiz-feedback" className="answer-box">
                  {feedback}
                </div>
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
            </div>
          )}

          {view === 'result' && resultMessage && (
            <div id="quiz-result">
              <div className="result-animation">
                <div id="result-icon">{resultMessage.icon}</div>
                <p id="result-text">{resultMessage.text}</p>
              </div>
            </div>
          )}
        </div>
      </Box>
    </Box>
  )
}

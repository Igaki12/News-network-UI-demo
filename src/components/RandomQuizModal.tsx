import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import type { QuizChoice, QuizQuestion } from '../types'
import { shuffleArray } from '../utils/data'

type Props = {
  isOpen: boolean
  question: QuizQuestion | null
  onClose: () => void
  onOpenArticle: () => void
  onResult?: (isCorrect: boolean) => void
  currentDateLabel?: string
  headline?: string
}

export const RandomQuizModal = ({ isOpen, question, onClose, onOpenArticle, onResult, currentDateLabel, headline }: Props) => {
  const [choiceStatus, setChoiceStatus] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [reported, setReported] = useState(false)

  const shuffledChoices = useMemo(() => (question ? shuffleArray(question.choices) : []), [question])

  useEffect(() => {
    if (isOpen) {
      setChoiceStatus({})
      setFeedback(null)
      setLocked(false)
      setReported(false)
    }
  }, [isOpen, question])

  if (!isOpen || !question) return null

  const handleChoiceSelection = (choice: QuizChoice) => {
    if (locked) return
    setLocked(true)
    const correctChoice = question.choices.find((c) => c.isCorrect)
    setChoiceStatus({
      [choice.id]: choice.isCorrect ? 'correct' : 'incorrect',
      ...(correctChoice ? { [correctChoice.id]: 'correct' } : {}),
    })
    if (choice.isCorrect) {
      setFeedback('正解です！')
    } else {
      setFeedback(`正解は「${question.correctText}」です。`)
    }
    if (!reported && onResult) {
      onResult(choice.isCorrect)
      setReported(true)
    }
  }

  return (
    <Box className={`modal ${isOpen ? 'visible' : ''}`}>
      <Box className="backdrop" onClick={onClose} />
        <Box className="dialog" role="dialog" aria-modal="true">
          <Box as="header" display="flex" justifyContent="space-between" alignItems="center" mb="14px">
            <Heading as="h2" size="md" m={0}>
              ランダムに確認問題を出題する
            </Heading>
            <Button aria-label="閉じる" onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          </Box>
          <Box className="dialog-content" id="random-content">
            <Box marginBottom="16px" padding="12px 16px" borderRadius="12px" background="rgba(15,23,42,0.04)" boxShadow="inset 0 0 0 1px rgba(148,163,184,0.25)">
              <Text fontSize="sm" color="var(--muted)">
                {currentDateLabel || 'YYYY-MM-DD'}
              </Text>
              <Heading as="h4" size="sm" marginTop="6px">
                {headline || '関連ニュース'}
              </Heading>
            </Box>
            <Text id="random-question-text">{question.prompt}</Text>
            <Box id="random-choices" className="choice-grid" data-locked={locked}>
            {shuffledChoices.map((choice) => (
              <Button
                key={choice.id}
                type="button"
                className={`choice-button ${choiceStatus[choice.id] ?? ''}`}
                onClick={() => handleChoiceSelection(choice)}
                disabled={locked}
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
            <Box id="random-feedback" className="answer-box">
              {feedback}
            </Box>
          )}
          <Box textAlign="center" marginTop="24px">
            <Button
              id="random-open-article-btn"
              className="btn-primary"
              type="button"
              height="auto"
              onClick={() => {
                onClose()
                onOpenArticle()
              }}
            >
              中断して元記事を確認
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

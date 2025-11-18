import { Box, Button } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import type { QuizChoice, QuizQuestion } from '../types'
import { shuffleArray } from '../utils/data'

type Props = {
  isOpen: boolean
  question: QuizQuestion | null
  onClose: () => void
  onOpenArticle: () => void
}

export const RandomQuizModal = ({ isOpen, question, onClose, onOpenArticle }: Props) => {
  const [choiceStatus, setChoiceStatus] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setChoiceStatus({})
      setFeedback(null)
      setLocked(false)
    }
  }, [isOpen, question])

  if (!isOpen || !question) return null

  const shuffled = useMemo(() => shuffleArray(question.choices), [question])

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
  }

  return (
    <Box className={`modal ${isOpen ? 'visible' : ''}`}>
      <Box className="backdrop" onClick={onClose} />
      <Box className="dialog" role="dialog" aria-modal="true">
        <header>
          <h2>ランダムに確認問題を出題する</h2>
          <button className="close" aria-label="閉じる" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="dialog-content" id="random-content">
          <p id="random-question-text">{question.prompt}</p>
          <div id="random-choices" className="choice-grid" data-locked={locked}>
            {shuffled.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className={`choice-button ${choiceStatus[choice.id] ?? ''}`}
                onClick={() => handleChoiceSelection(choice)}
                disabled={locked}
              >
                {choice.text}
              </button>
            ))}
          </div>
          {feedback && (
            <div id="random-feedback" className="answer-box">
              {feedback}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button
              id="random-open-article-btn"
              className="btn-primary"
              type="button"
              onClick={() => {
                onClose()
                onOpenArticle()
              }}
            >
              どんなニュース記事なのか確認する
            </Button>
          </div>
        </div>
      </Box>
    </Box>
  )
}

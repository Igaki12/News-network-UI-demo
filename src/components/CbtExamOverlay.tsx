import { Badge, Box, Button, Flex, Heading, Progress, SimpleGrid, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CbtQuestion } from '../types'

const TIME_LIMIT_MS = 10 * 60 * 1000

type Props = {
  questions: CbtQuestion[]
  onExit: () => void
  currentDateLabel: string
}

type AnswerRecord = {
  choiceId: string
  isCorrect: boolean
}

type ChoiceStat = {
  choiceId: string
  text: string
  percentage: number
  isCorrect: boolean
  isSelected: boolean
}

type ResultSummary = {
  correctCount: number
  total: number
  accuracy: number
  elapsedMs: number
  estimatedDeviation: number
  distributions: Record<string, ChoiceStat[]>
}

const formatClock = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const leftover = seconds % 60
  return `${minutes}分${leftover}秒`
}

const generateDummyDistribution = (question: CbtQuestion, selectedChoiceId: string | null): ChoiceStat[] => {
  if (question.choices.length === 0) return []
  const weights = question.choices.map(() => Math.random() + 0.35)
  const sum = weights.reduce((total, weight) => total + weight, 0)
  let percentages = weights.map((weight) => Math.round((weight / sum) * 100))
  let diff = 100 - percentages.reduce((acc, current) => acc + current, 0)
  let idx = 0
  while (diff !== 0 && percentages.length > 0) {
    const cursor = idx % percentages.length
    if (diff > 0) {
      percentages[cursor] += 1
      diff -= 1
    } else if (percentages[cursor] > 0) {
      percentages[cursor] -= 1
      diff += 1
    }
    idx += 1
    if (idx > 200) break
  }
  return question.choices.map((choice, index) => ({
    choiceId: choice.id,
    text: choice.text,
    percentage: percentages[index] ?? 0,
    isCorrect: choice.isCorrect,
    isSelected: selectedChoiceId === choice.id,
  }))
}

export const CbtExamOverlay = ({ questions, onExit, currentDateLabel }: Props) => {
  const [phase, setPhase] = useState<'exam' | 'result'>('exam')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({})
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_MS)
  const [result, setResult] = useState<ResultSummary | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
    setTimeLeft(TIME_LIMIT_MS)
    setPhase('exam')
    setResult(null)
    setAnswers({})
    setCurrentIndex(0)
    setSelectedChoiceId(null)
  }, [questions])

  const computeSummary = useCallback(
    (reason: 'complete' | 'timeout'): ResultSummary => {
      const elapsed = reason === 'timeout' ? TIME_LIMIT_MS : Math.min(Date.now() - startTimeRef.current, TIME_LIMIT_MS)
      const total = questions.length
      const correctCount = questions.reduce((count, question) => (answers[question.id]?.isCorrect ? count + 1 : count), 0)
      const accuracy = total > 0 ? correctCount / total : 0
      const estimatedDeviation = Math.max(
        35,
        Math.min(75, Math.round(50 + (accuracy - 0.5) * 40 + (Math.random() * 8 - 4))),
      )
      const distributions: Record<string, ChoiceStat[]> = {}
      questions.forEach((question) => {
        distributions[question.id] = generateDummyDistribution(question, answers[question.id]?.choiceId ?? null)
      })
      return {
        correctCount,
        total,
        accuracy,
        elapsedMs: elapsed,
        estimatedDeviation,
        distributions,
      }
    },
    [answers, questions],
  )

  const finalizeExam = useCallback(
    (reason: 'complete' | 'timeout') => {
      setPhase('result')
      setResult((prev) => prev ?? computeSummary(reason))
    },
    [computeSummary],
  )

  useEffect(() => {
    if (phase !== 'exam') return
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(TIME_LIMIT_MS - elapsed, 0)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        window.clearInterval(interval)
        finalizeExam('timeout')
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [phase, finalizeExam])

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex])
  const currentHeadline = currentQuestion
    ? currentQuestion.article.headline || currentQuestion.article.named_entities?.[0] || '関連ニュース'
    : '関連ニュース'

  useEffect(() => {
    setSelectedChoiceId(null)
  }, [currentQuestion])

  if (questions.length === 0) {
    return (
      <Box
        position="fixed"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={90}
        background="rgba(15, 23, 42, 0.6)"
      >
        <Box className="hud-card" padding="32px" textAlign="center">
          <Heading size="md" marginBottom="12px">
            CBTモードを開始できません
          </Heading>
          <Text>必要な問題を準備できませんでした。元の画面に戻ってください。</Text>
          <Button marginTop="24px" onClick={onExit} className="btn-primary">
            戻る
          </Button>
        </Box>
      </Box>
    )
  }

  const handleCommitAnswer = () => {
    if (!currentQuestion || !selectedChoiceId) return
    const selectedChoice = currentQuestion.choices.find((choice) => choice.id === selectedChoiceId)
    const record: AnswerRecord = {
      choiceId: selectedChoiceId,
      isCorrect: Boolean(selectedChoice?.isCorrect),
    }
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: record,
    }))
    if (currentIndex === questions.length - 1) {
      finalizeExam('complete')
    } else {
      setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))
    }
  }

  return (
    <Box
      id="cbt-overlay"
      position="fixed"
      inset={0}
      background="linear-gradient(135deg, rgba(241,245,249,0.96), rgba(226,232,240,0.92))"
      backdropFilter="blur(6px)"
      zIndex={90}
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="18px"
      pb="30px"
      overflowY="auto"
    >
      <Box className="hud-card" width="min(960px, 96vw)" padding={{ base: '20px', md: '32px' }}>
        {phase === 'exam' && currentQuestion && (
          <Box>
            <Heading as="h2" size="lg" marginBottom="8px">
              CBTチャレンジモード
            </Heading>
            <Text color="var(--muted)" marginBottom="24px">
              currentDateの主要エンティティから抽出した理解度テストを10問出題します。制限時間内に回答してください。
            </Text>
            <Flex justifyContent="space-between" alignItems="center" marginBottom="12px" flexWrap="wrap" gap="8px">
              <Text fontWeight="bold">
                問題 {currentIndex + 1} / {questions.length}
              </Text>
              <Badge colorScheme={timeLeft < TIME_LIMIT_MS * 0.25 ? 'red' : 'cyan'} fontSize="0.95em" padding="8px 12px" borderRadius="999px">
                残り時間: {formatClock(timeLeft)}
              </Badge>
            </Flex>
            <Progress value={(Math.max(TIME_LIMIT_MS - timeLeft, 0) / TIME_LIMIT_MS) * 100} borderRadius="md" marginBottom="20px" height="8px" />
            <Box borderRadius="16px" padding="20px" background="rgba(255,255,255,0.82)" boxShadow="inset 0 0 0 1px rgba(148, 163, 184, 0.2)">
                          <Box marginBottom="16px" padding="12px 16px" borderRadius="12px" background="rgba(15,23,42,0.04)" boxShadow="inset 0 0 0 1px rgba(148,163,184,0.25)">
              <Text fontSize="sm" color="var(--muted)">
                {currentDateLabel || 'YYYY-MM-DD'}
              </Text>
              <Heading as="h4" size="sm" marginTop="6px">
                {currentHeadline}
              </Heading>
            </Box>
              <Heading as="h3" size="md" marginBottom="12px">
                {currentQuestion.prompt}
              </Heading>
              <Box display="grid" gap="14px" gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))">
                {currentQuestion.choices.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id
                  return (
                    <Button
                      key={choice.id}
                      variant="outline"
                      justifyContent="flex-start"
                      textAlign="left"
                      height="auto"
                      whiteSpace="normal"
                      padding="14px"
                      borderColor={isSelected ? 'var(--accent-glow)' : 'rgba(148, 163, 184, 0.6)'}
                      background={isSelected ? 'rgba(14, 165, 233, 0.08)' : 'rgba(255,255,255,0.9)'}
                      color={isSelected ? 'var(--text)' : 'inherit'}
                      boxShadow={isSelected ? '0 14px 32px rgba(14, 165, 233, 0.22)' : 'none'}
                      onClick={() => setSelectedChoiceId(choice.id)}
                    >
                      {choice.text}
                    </Button>
                  )
                })}
              </Box>
            </Box>
            <Flex justifyContent="space-between" alignItems="center" marginTop="24px" flexWrap="wrap" gap="12px">
              <Text color="var(--muted)">
                一度選択した後は結果発表まで正解を確認できません。
              </Text>
              <Button
                className="btn-primary"
                type="button"
                onClick={handleCommitAnswer}
                isDisabled={!selectedChoiceId}
              >
                {currentIndex === questions.length - 1 ? '結果を表示' : '次の問題へ'}
              </Button>
            </Flex>
          </Box>
        )}

        {phase === 'result' && result && (
          <Box>
            <Heading as="h2" size="lg" marginBottom="10px">
              CBT結果レポート
            </Heading>
            <Text color="var(--muted)" marginBottom="24px">
              所要時間と正答率に基づくダミー統計です。学習の目安としてご活用ください。
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="16px" marginBottom="28px">
              <Box borderRadius="14px" padding="16px" background="rgba(255,255,255,0.9)" boxShadow="inset 0 0 0 1px rgba(148,163,184,0.18)">
                <Text fontSize="sm" color="var(--muted)">正答率</Text>
                <Heading size="md">{Math.round(result.accuracy * 100)}%</Heading>
              </Box>
              <Box borderRadius="14px" padding="16px" background="rgba(255,255,255,0.9)" boxShadow="inset 0 0 0 1px rgba(148,163,184,0.18)">
                <Text fontSize="sm" color="var(--muted)">所要時間</Text>
                <Heading size="md">{formatDuration(result.elapsedMs)}</Heading>
              </Box>
              <Box borderRadius="14px" padding="16px" background="rgba(255,255,255,0.9)" boxShadow="inset 0 0 0 1px rgba(148,163,184,0.18)">
                <Text fontSize="sm" color="var(--muted)">推定偏差値（ダミー）</Text>
                <Heading size="md">{result.estimatedDeviation}</Heading>
              </Box>
            </SimpleGrid>
            <Box display="flex" flexDirection="column" gap="20px" maxHeight="55vh" overflowY="auto" paddingRight="4px">
              {questions.map((question, index) => {
                const distribution = result.distributions[question.id] ?? []
                const selected = answers[question.id]?.choiceId ?? null
                return (
                  <Box key={question.id} borderRadius="16px" padding="18px" background="rgba(255,255,255,0.88)" boxShadow="inset 0 0 0 1px rgba(148,163,184,0.16)">
                    <Flex justifyContent="space-between" alignItems="center" marginBottom="10px" flexWrap="wrap" gap="8px">
                      <Text fontWeight="bold">
                        Q{index + 1}. {question.prompt}
                      </Text>
                      {selected ? (
                        <Badge colorScheme="purple" borderRadius="999px" padding="6px 10px">
                          あなたの回答を表示中
                        </Badge>
                      ) : (
                        <Badge borderRadius="999px" padding="6px 10px" colorScheme="gray">
                          未回答
                        </Badge>
                      )}
                    </Flex>
                    <Box display="flex" flexDirection="column" gap="12px">
                      {distribution.map((choice) => (
                        <Box key={choice.choiceId}>
                          <Flex justifyContent="space-between" fontWeight={choice.isCorrect ? 'bold' : 'normal'}>
                            <Text color={choice.isCorrect ? '#0f172a' : 'inherit'}>
                              {choice.text}
                              {choice.isCorrect ? '（正解）' : ''}
                              {choice.isSelected ? ' ／ あなたの選択' : ''}
                            </Text>
                            <Text>{choice.percentage}%</Text>
                          </Flex>
                          <Progress
                            value={choice.percentage}
                            height="8px"
                            borderRadius="md"
                            marginTop="6px"
                            colorScheme={choice.isCorrect ? 'green' : 'blue'}
                            opacity={choice.isSelected || choice.isCorrect ? 1 : 0.6}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )
              })}
            </Box>
            <Flex justifyContent="flex-end" marginTop="28px">
              <Button className="btn-primary" onClick={onExit}>
                元の画面に戻る
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  )
}

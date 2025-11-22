import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, PlusSquareIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Heading,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spacer,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

type Props = {
  hasData: boolean
  onFileSelected: (file: File) => void
  currentDateDisplay: string
  onPrevDate: () => void
  onNextDate: () => void
  onSelectDate: (dateId: string) => void
  disablePrev: boolean
  disableNext: boolean
  onRandomQuestion: () => void
  onUseProvidedFile: () => void
  isLoading: boolean
  onStartCbt: () => void
  availableDates: string[]
  currentDateId: string | null
}

export const TopLeftPanel = ({
  hasData,
  onFileSelected,
  currentDateDisplay,
  onPrevDate,
  onNextDate,
  onSelectDate,
  disablePrev,
  disableNext,
  onRandomQuestion,
  onUseProvidedFile,
  isLoading,
  onStartCbt,
  availableDates,
  currentDateId,
}: Props) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelected(file)
      event.target.value = ''
    }
  }

  const parseDateId = (dateId: string) => {
    if (!dateId || dateId.length !== 8) return null
    const year = Number(dateId.slice(0, 4))
    const month = Number(dateId.slice(4, 6)) - 1
    const day = Number(dateId.slice(6, 8))
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null
    return new Date(year, month, day)
  }

  const formatDateId = (date: Date) => {
    const y = date.getFullYear().toString().padStart(4, '0')
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}${m}${d}`
  }

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const parsed = currentDateId ? parseDateId(currentDateId) : null
    if (parsed) return parsed
    const fallbackId = availableDates[availableDates.length - 1]
    const fallback = fallbackId ? parseDateId(fallbackId) : null
    return fallback ?? new Date()
  })

  useEffect(() => {
    if (currentDateId) {
      const parsed = parseDateId(currentDateId)
      if (parsed) {
        setVisibleMonth(parsed)
        return
      }
    }
    if (availableDates.length > 0) {
      const fallback = parseDateId(availableDates[availableDates.length - 1])
      if (fallback) {
        setVisibleMonth(fallback)
      }
    }
  }, [availableDates, currentDateId])

  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates])

  const { isOpen: isCalendarOpen, onOpen: openCalendar, onClose: closeCalendar } = useDisclosure()
  const toggleCalendar = () => {
    if (isCalendarOpen) {
      closeCalendar()
    } else {
      openCalendar()
    }
  }

  const calendarDays = useMemo(() => {
    const base = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const startDay = base.getDay()
    base.setDate(base.getDate() - startDay)
    const days: Array<{ date: Date; dateId: string; isCurrentMonth: boolean }> = []
    for (let i = 0; i < 42; i += 1) {
      const item = new Date(base)
      item.setDate(base.getDate() + i)
      const dateId = formatDateId(item)
      days.push({ date: item, dateId, isCurrentMonth: item.getMonth() === visibleMonth.getMonth() })
    }
    return days
  }, [visibleMonth])

  const handleDateSelect = (dateId: string) => {
    if (!availableDateSet.has(dateId)) return
    onSelectDate(dateId)
    closeCalendar()
  }

  const moveVisibleMonth = (delta: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <Box id="hudTopLeft" className="overlay hud-card" aria-live="polite" left={{ base: '8px', md: '16px' }}>
      <Heading
        as="h1"
        bgGradient="linear(110deg, rgba(14,165,233,0.95), rgba(59,130,246,0.95), rgba(14,165,233,0.8))"
        bgClip="text"
        fontWeight="extrabold"
      >
        ニュースの地図を広げる
      </Heading>
      {!hasData && (
        <>
          <Box id="upload-container" className="file-upload-area">
            <Text>
              分析したいニュース記事のJSONLファイルをアップロードしてください。その日その時代を飾った出来事についてネットワーク地図を作成します。
            </Text>
            <label className={`file-label${isLoading ? ' disabled' : ''}`}>
              <input type="file" accept=".jsonl" onChange={handleFileChange} disabled={isLoading} />
              <PlusSquareIcon boxSize="20px" aria-hidden="true" />
              <span>ファイルを選択</span>
            </label>
            <Text>または</Text>
            <Button
              mb="16px"
              type="button"
              className="btn-primary"
              onClick={onUseProvidedFile}
              isDisabled={isLoading}
              isLoading={isLoading}
              loadingText="読み込み中..."
            >
              用意されているファイルを使用する
            </Button>
          </Box>
        </>
      )}

      {hasData && (
        <Box id="date-container">
          <Text margin="0 0 8px 0" color="var(--muted)" fontSize="14px">
            表示する日付を選択してください
          </Text>
          <Box id="date-controls" display="flex" alignItems="center" gap="8px">
            <Button
              id="prev-date-btn"
              aria-label="前の日"
              onClick={onPrevDate}
              isDisabled={disablePrev || isLoading}
              variant="ghost"
            >
              <ArrowLeftIcon />
            </Button>
            <Popover placement="bottom-start" isLazy isOpen={isCalendarOpen} onClose={closeCalendar} closeOnBlur>
              <PopoverTrigger>
                <Box
                  id="current-date-display"
                  as="button"
                  type="button"
                  textAlign="center"
                  minWidth="140px"
                  fontWeight="medium"
                  aria-live="polite"
                  aria-haspopup="dialog"
                  aria-expanded={isCalendarOpen}
                  aria-label="日付を直接選択する"
                  padding="8px 12px"
                  borderRadius="12px"
                  border="1px solid transparent"
                  _hover={{ borderColor: 'var(--accent-glow)', cursor: 'pointer' }}
                  background="rgba(255,255,255,0.5)"
                  boxShadow="inset 0 0 0 1px rgba(255,255,255,0.2)"
                  onClick={toggleCalendar}
                >
                  {currentDateDisplay || 'YYYY-MM-DD'}
                </Box>
              </PopoverTrigger>
              <PopoverContent
                width="280px"
                borderRadius="16px"
                backdropFilter="blur(14px)"
                background="rgba(255,255,255,0.92)"
                border="1px solid rgba(59,130,246,0.25)"
                boxShadow="0 20px 45px rgba(14,165,233,0.25)"
                color="var(--text)"
              >
                <PopoverArrow />
                <PopoverHeader>
                  <Box display="flex" alignItems="center" justifyContent="space-between" gap="8px">
                    <IconButton
                      aria-label="前の月"
                      size="sm"
                      variant="ghost"
                      icon={<ChevronLeftIcon />}
                      onClick={() => moveVisibleMonth(-1)}
                    />
                    <Text fontWeight="semibold">
                      {visibleMonth.getFullYear()}年 {visibleMonth.getMonth() + 1}月
                    </Text>
                    <IconButton
                      aria-label="次の月"
                      size="sm"
                      variant="ghost"
                      icon={<ChevronRightIcon />}
                      onClick={() => moveVisibleMonth(1)}
                    />
                  </Box>
                </PopoverHeader>
                <PopoverBody>
                  <Box fontSize="12px" display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="4px" mb="4px" textAlign="center">
                    {['日', '月', '火', '水', '木', '金', '土'].map((label) => (
                      <Text key={label} opacity={0.7} fontWeight="bold">
                        {label}
                      </Text>
                    ))}
                  </Box>
                  <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="4px">
                    {calendarDays.map(({ date, dateId, isCurrentMonth }) => {
                      const isAvailable = availableDateSet.has(dateId)
                      const isSelected = currentDateId === dateId
                      return (
                        <Button
                          key={dateId}
                          size="sm"
                          height="32px"
                          variant={isSelected ? 'solid' : 'ghost'}
                          colorScheme={isSelected ? 'blue' : undefined}
                          opacity={isCurrentMonth ? 1 : 0.4}
                          isDisabled={!isAvailable}
                          onClick={() => handleDateSelect(dateId)}
                        >
                          {date.getDate()}
                        </Button>
                      )
                    })}
                  </Box>
                  <Text fontSize="12px" opacity={0.8} mt="8px">
                    選択可能な日だけがタップできます。
                  </Text>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Button id="next-date-btn" aria-label="次の日" onClick={onNextDate} isDisabled={disableNext || isLoading} variant="ghost">
              <ArrowRightIcon />
            </Button>
          </Box>
          <Button
            id="random-question-btn"
            className="btn-primary"
            marginTop="16px"
            type="button"
            onClick={onRandomQuestion}
            isDisabled={isLoading}
          >
            ランダムで１問解く
          </Button>
          <Spacer />
          <Button
            id="cbt-mode-btn"
            variant="outline"
            marginTop="12px"
            borderRadius="14px"
            type="button"
            onClick={onStartCbt}
            isDisabled={isLoading}
            borderColor="rgba(14, 165, 233, 0.6)"
            color="var(--text)"
            background="rgba(255,255,255,0.75)"
            _hover={{
              background: 'rgba(14, 165, 233, 0.08)',
              borderColor: 'var(--accent-glow)',
              boxShadow: '0 14px 32px rgba(14, 165, 233, 0.18)',
            }}
            _disabled={{ opacity: 0.6, cursor: 'not-allowed', boxShadow: 'none' }}
          >
            CBTに挑戦する
          </Button>
        </Box>
      )}
    </Box>
  )
}

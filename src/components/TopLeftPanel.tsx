import { ArrowLeftIcon, ArrowRightIcon, PlusSquareIcon } from '@chakra-ui/icons'
import { Box, Button, Heading, Spacer, Text } from '@chakra-ui/react'
import type { ChangeEvent } from 'react'

type Props = {
  hasData: boolean
  onFileSelected: (file: File) => void
  currentDateDisplay: string
  onPrevDate: () => void
  onNextDate: () => void
  disablePrev: boolean
  disableNext: boolean
  onRandomQuestion: () => void
  onUseProvidedFile: () => void
  isLoading: boolean
  onStartCbt: () => void
}

export const TopLeftPanel = ({
  hasData,
  onFileSelected,
  currentDateDisplay,
  onPrevDate,
  onNextDate,
  disablePrev,
  disableNext,
  onRandomQuestion,
  onUseProvidedFile,
  isLoading,
  onStartCbt,
}: Props) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelected(file)
      event.target.value = ''
    }
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
            <Box
              id="current-date-display"
              textAlign="center"
              minWidth="120px"
              fontWeight="medium"
              aria-live="polite"
            >
              {currentDateDisplay || 'YYYY-MM-DD'}
            </Box>
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
            ランダムで問題を出題する
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

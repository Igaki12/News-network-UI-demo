import { PlusSquareIcon } from '@chakra-ui/icons'
import { Box, Button, Heading, Text } from '@chakra-ui/react'
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
          <Box id="date-controls">
            <button id="prev-date-btn" className="date-nav-btn" title="前の日" onClick={onPrevDate} disabled={disablePrev || isLoading}>
              ◀
            </button>
            <div id="current-date-display">{currentDateDisplay || 'YYYY-MM-DD'}</div>
            <button id="next-date-btn" className="date-nav-btn" title="次の日" onClick={onNextDate} disabled={disableNext || isLoading}>
              ▶
            </button>
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
        </Box>
      )}
    </Box>
  )
}

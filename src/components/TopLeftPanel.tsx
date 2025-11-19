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
    <Box id="hudTopLeft" className="overlay hud-card" aria-live="polite">
      <Heading as="h1">トピックマップを広げる</Heading>
      {!hasData && (
        <>
          <Box id="upload-container" className="file-upload-area">
            <Text>
              分析したいニュース記事のJSONLファイルをアップロードしてください。その日その時代を飾った出来事についてネットワーク地図を作成します。
            </Text>
            <label className="file-label">
              <input type="file" accept=".jsonl" onChange={handleFileChange} />
              📁 ファイルを選択
            </label>
            <Text>または</Text>
            <Button
              mb="16px"
              type="button"
              className="btn-primary"
              onClick={onUseProvidedFile}
              isDisabled={isLoading}
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
            <button id="prev-date-btn" className="date-nav-btn" title="前の日" onClick={onPrevDate} disabled={disablePrev}>
              ◀
            </button>
            <div id="current-date-display">{currentDateDisplay || 'YYYY-MM-DD'}</div>
            <button id="next-date-btn" className="date-nav-btn" title="次の日" onClick={onNextDate} disabled={disableNext}>
              ▶
            </button>
          </Box>
          <Button
            id="random-question-btn"
            className="btn-primary"
            marginTop="16px"
            type="button"
            onClick={onRandomQuestion}
          >
            ランダムで問題を出題する
          </Button>
        </Box>
      )}
    </Box>
  )
}

import { Box, Text } from '@chakra-ui/react'

type Props = {
  isVisible: boolean
  details: string[]
  placeholder?: string
}

export const NodeDetailsCard = ({ isVisible, details, placeholder }: Props) => (
  <Box
    id="hudBottomLeft"
    className="overlay hud-card"
    style={{ display: isVisible ? 'block' : 'none' }}
  >
    <Box id="infoBox">
      <Text as="h2">詳細</Text>
      {details.length === 0 && (
        <Text id="info-placeholder" className="muted">
          {placeholder || '気になるノードをクリックしたり、引っ張ったりしてみてください'}
        </Text>
      )}
      {details.length > 0 && (
        <Box as="ul" id="details" margin="0.25rem 0 0 1em">
          {details.map((detail, idx) => (
            <li key={`${detail}-${idx}`}>{detail}</li>
          ))}
        </Box>
      )}
    </Box>
  </Box>
)

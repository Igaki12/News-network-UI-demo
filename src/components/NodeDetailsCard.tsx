import { Box, Text } from '@chakra-ui/react'

type Props = {
  isVisible: boolean
  details: string[]
  placeholder?: string
  hasGlowingNodes?: boolean
}

export const NodeDetailsCard = ({ isVisible, details, placeholder, hasGlowingNodes = false }: Props) => (
  <Box
    id="hudBottomLeft"
    className="overlay hud-card"
    style={{ display: isVisible ? 'block' : 'none' }}
    left={{ base: "8px", md: "16px" }}
  >
    <Box id="infoBox">
      {/* <Text as="h2">{hasGlowingNodes ? '次のステップ：' : '詳細'}</Text> */}
      {details.length === 0 && (
        <Text id="info-placeholder" className="muted">
          {placeholder || (hasGlowingNodes ? '光っているノードを増やしてあなたの知識を広げましょう！' : '気になるノードをクリックしたり、引っ張ったりしてみてください')}
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

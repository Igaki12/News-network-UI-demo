import { Box, useBreakpointValue } from '@chakra-ui/react'

type FooterBadgeProps = {
  hasData: boolean
}

export const FooterBadge = ({ hasData }: FooterBadgeProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false
  const display = isMobile && hasData ? 'none' : undefined

  return (
    <Box className="copyright-notice overlay" display={display}>
      2025 © Happyman All rights reserved.
    </Box>
  )
}

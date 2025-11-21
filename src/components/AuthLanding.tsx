import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'

type AuthLandingProps = {
  onSignInClick: () => void
  onSignUpClick: () => void
}

export const AuthLanding = ({ onSignInClick, onSignUpClick }: AuthLandingProps) => {
  return (
    <Box position="fixed" inset={0} display="flex" alignItems="center" justifyContent="center" zIndex={90} px={{ base: 4, md: 6 }}>
      <Box
        className="hud-card"
        maxW="min(720px, 96vw)"
        w="full"
        p={{ base: 6, md: 8 }}
        textAlign="left"
      >
        <Stack spacing={4}>
          <Heading size="md" letterSpacing="widest" color="var(--muted)" textTransform="uppercase">
            News Network Portal
          </Heading>
          <Heading size="lg" lineHeight={1.3}>
            まずはメールアカウントでサインインして、所属グループの進捗を確認しましょう。
          </Heading>
          <Text color="var(--muted)">
            このUIは MySQL の <code>groups</code> / <code>user_group_memberships</code> 構成と連動する想定です。所属先を選び、
            ランダム出題や共起ネットワークの分析にアクセスできます。
          </Text>
          <Text color="var(--muted)">
            セキュアな資格情報でログインするまでネットワークへのアクセスはロックされます。アカウントをお持ちでない方は、所属先を申請した上で登録をお願いします。
          </Text>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={2}>
            <Button className="btn-primary" flex={1} onClick={onSignInClick}>
              サインイン
            </Button>
            <Button
              flex={1}
              variant="outline"
              borderColor="rgba(14, 165, 233, 0.5)"
              borderRadius="14px"
              onClick={onSignUpClick}
            >
              新規登録
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

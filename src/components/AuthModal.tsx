import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import type { AuthGroup, AuthResult } from '../types'

type AuthModalProps = {
  mode: 'signIn' | 'signUp'
  isOpen: boolean
  onClose: () => void
  onModeChange: (mode: 'signIn' | 'signUp') => void
  onSignIn: (payload: { email: string; password: string }) => Promise<AuthResult>
  onSignUp: (payload: {
    displayName: string
    email: string
    password: string
    groupId: number
    roleInGroup: string
    verificationCode: string
  }) => Promise<AuthResult>
  groups: AuthGroup[]
}

const ROLE_OPTIONS = [
  { value: 'student', label: 'student（学習者）' },
  { value: 'analyst', label: 'analyst（分析担当）' },
  { value: 'mentor', label: 'mentor（指導者）' },
]

export const AuthModal = ({ mode, isOpen, onClose, onModeChange, onSignIn, onSignUp, groups }: AuthModalProps) => {
  const toast = useToast()
  const [isSubmitting, setSubmitting] = useState(false)
  const [signInForm, setSignInForm] = useState({ email: '', password: '' })
  const [signUpForm, setSignUpForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    groupId: groups[0]?.id.toString() ?? '',
    roleInGroup: ROLE_OPTIONS[0].value,
    verificationCode: '',
  })
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSignInForm({ email: '', password: '' })
      setSignUpForm({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        groupId: groups[0]?.id.toString() ?? '',
        roleInGroup: ROLE_OPTIONS[0].value,
        verificationCode: '',
      })
      setSentCode(null)
      setVerificationSent(false)
    }
  }, [isOpen, groups])

  const handleSendCode = () => {
    const nextCode = Math.floor(100000 + Math.random() * 900000).toString()
    setSentCode(nextCode)
    setVerificationSent(true)
    toast({
      status: 'info',
      title: '認証メールを送信しました（ダミー）',
      description: `テスト用コード: ${nextCode} を入力してください。`,
      duration: 5000,
      isClosable: true,
    })
  }

  const groupOptions = useMemo(() => groups.map((group) => ({ label: group.name, value: group.id.toString() })), [groups])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signIn') {
        const result = await onSignIn({ ...signInForm })
        if (result.success) {
          toast({ status: 'success', title: 'サインインしました。' })
          onClose()
        } else {
          toast({ status: 'error', title: 'サインインに失敗しました。', description: result.message || '入力内容をご確認ください。' })
        }
      } else {
        if (!verificationSent) {
          toast({ status: 'warning', title: '認証メールを送信してください。' })
          return
        }
        if (!sentCode || signUpForm.verificationCode.trim() !== sentCode) {
          toast({ status: 'error', title: '認証コードが一致しません。' })
          return
        }
        if (signUpForm.password.length < 8) {
          toast({ status: 'error', title: 'パスワードは8文字以上で入力してください。' })
          return
        }
        if (signUpForm.password !== signUpForm.confirmPassword) {
          toast({ status: 'error', title: '確認用パスワードが一致しません。' })
          return
        }
        const result = await onSignUp({
          displayName: signUpForm.displayName.trim(),
          email: signUpForm.email.trim(),
          password: signUpForm.password,
          groupId: Number(signUpForm.groupId),
          roleInGroup: signUpForm.roleInGroup,
          verificationCode: signUpForm.verificationCode,
        })
        if (result.success) {
          toast({ status: 'success', title: '登録が完了しました。' })
          onClose()
        } else {
          toast({ status: 'error', title: '登録に失敗しました。', description: result.message || '時間をおいて再度お試しください。' })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderSignInForm = () => (
    <Stack spacing={4} mt={4}>
      <FormControl isRequired>
        <FormLabel>メールアドレス</FormLabel>
        <Input
          type="email"
          value={signInForm.email}
          onChange={(event) => setSignInForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="you@example.com"
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>パスワード</FormLabel>
        <Input
          type="password"
          value={signInForm.password}
          onChange={(event) => setSignInForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="パスワード"
        />
      </FormControl>
    </Stack>
  )

  const renderSignUpForm = () => (
    <Stack spacing={4} mt={4}>
      <FormControl isRequired>
        <FormLabel>表示名</FormLabel>
        <Input value={signUpForm.displayName} onChange={(event) => setSignUpForm((prev) => ({ ...prev, displayName: event.target.value }))} placeholder="例: News Learner" />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>メールアドレス</FormLabel>
        <Input type="email" value={signUpForm.email} onChange={(event) => setSignUpForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@example.com" />
      </FormControl>
      <HStack spacing={4} flexWrap="wrap">
        <FormControl flex={1} minW="180px">
          <FormLabel>所属グループ</FormLabel>
          <Select value={signUpForm.groupId} onChange={(event) => setSignUpForm((prev) => ({ ...prev, groupId: event.target.value }))}>
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl flex={1} minW="180px">
          <FormLabel>役割</FormLabel>
          <Select value={signUpForm.roleInGroup} onChange={(event) => setSignUpForm((prev) => ({ ...prev, roleInGroup: event.target.value }))}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      </HStack>
      <HStack spacing={4} flexWrap="wrap">
        <FormControl flex={1} minW="180px" isRequired>
          <FormLabel>パスワード</FormLabel>
          <Input type="password" value={signUpForm.password} onChange={(event) => setSignUpForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="8文字以上" />
        </FormControl>
        <FormControl flex={1} minW="180px" isRequired>
          <FormLabel>パスワード（確認）</FormLabel>
          <Input type="password" value={signUpForm.confirmPassword} onChange={(event) => setSignUpForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
        </FormControl>
      </HStack>
      <FormControl>
        <FormLabel>認証コード</FormLabel>
        <HStack>
          <Input value={signUpForm.verificationCode} onChange={(event) => setSignUpForm((prev) => ({ ...prev, verificationCode: event.target.value }))} placeholder="6 桁のコード" maxW="220px" />
          <Button variant="ghost" onClick={handleSendCode} borderRadius="12px">
            認証メールを送信
          </Button>
        </HStack>
        {verificationSent && sentCode && (
          <Alert status="success" mt={3} borderRadius="12px">
            <AlertIcon />
            <AlertDescription>デモ用コード: {sentCode}</AlertDescription>
          </Alert>
        )}
      </FormControl>
      <Box fontSize="sm" color="var(--muted)">
        認証コードが一致すると <code>user_group_memberships</code> に所属が登録される想定です。
      </Box>
    </Stack>
  )

  const heroText = mode === 'signIn' ? '登録済みのメールアカウントでログイン' : 'グループに所属して学習を開始'

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius="24px" p={2} background="rgba(255,255,255,0.92)" boxShadow="0 30px 60px rgba(15,23,42,0.2)">
        <ModalHeader>{heroText}</ModalHeader>
        <ModalCloseButton borderRadius="full" />
        <ModalBody>
          <form id="auth-form" onSubmit={handleSubmit}>
            {mode === 'signIn' ? renderSignInForm() : renderSignUpForm()}
          </form>
          <Text mt={6} fontSize="sm" color="var(--muted)">
            {mode === 'signIn' ? 'はじめての利用ですか？' : 'すでにアカウントをお持ちですか？'}{' '}
            <Link color="var(--accent-glow)" onClick={() => onModeChange(mode === 'signIn' ? 'signUp' : 'signIn')}>
              {mode === 'signIn' ? '新規登録はこちら' : 'サインイン画面へ' }
            </Link>
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" form="auth-form" className="btn-primary" w="full" isLoading={isSubmitting} loadingText="処理中...">
            {mode === 'signIn' ? 'サインイン' : 'アカウントを作成'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

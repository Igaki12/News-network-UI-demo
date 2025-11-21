import { ArrowForwardIcon } from '@chakra-ui/icons'
import { Avatar, Box, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text, VStack } from '@chakra-ui/react'
import type { AuthUser } from '../types'

type UserProfileButtonProps = {
  user: AuthUser
  groupName?: string
  onLogout: () => void
}

export const UserProfileButton = ({ user, groupName, onLogout }: UserProfileButtonProps) => {
  return (
    <Box position="fixed" top={{ base: '10px', md: '18px' }} right={{ base: '10px', md: '24px' }} zIndex={60}>
      <Menu placement="bottom-end">
        <MenuButton
          as={IconButton}
          aria-label="ユーザーメニュー"
          icon={<Avatar size="sm" name={user.displayName} bg="rgba(14,165,233,0.4)" color="var(--text)" />}
          borderRadius="full"
          variant="ghost"
          border="1px solid rgba(255,255,255,0.5)"
          boxShadow="0 10px 24px rgba(15,23,42,0.25)"
          _hover={{ boxShadow: '0 12px 32px rgba(14,165,233,0.3)' }}
        />
        <MenuList borderRadius="18px" p={3} boxShadow="0 20px 40px rgba(15,23,42,0.3)">
          <VStack align="flex-start" spacing={1} px={1} pb={2}>
            <Text fontWeight="bold">{user.displayName}</Text>
            <Text fontSize="sm" color="var(--muted)">
              {user.email}
            </Text>
            {groupName && (
              <Text fontSize="sm" color="var(--muted)">
                {groupName} / {user.roleInGroup}
              </Text>
            )}
          </VStack>
          <MenuDivider />
          <MenuItem icon={<ArrowForwardIcon />} onClick={onLogout} borderRadius="12px">
            サインアウト
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  )
}

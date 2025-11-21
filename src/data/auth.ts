import type { AuthGroup, DemoAccount } from '../types'

export const AUTH_GROUPS: AuthGroup[] = [
  { id: 1, name: 'NewsQuest Academy 1年A組', groupType: 'school' },
  { id: 2, name: 'Metropolitan Policy Lab', groupType: 'class' },
  { id: 3, name: 'Global Media Mentors', groupType: 'training' },
]

export const SAMPLE_ACCOUNTS: DemoAccount[] = [
  {
    email: 'student.alpha+demo01@example.com',
    password: 'NewsQuest#01',
    displayName: 'Student Alpha',
    groupId: 1,
    roleInGroup: 'student',
  },
  {
    email: 'analyst.bravo+demo02@example.com',
    password: 'NewsQuest#02',
    displayName: 'Analyst Bravo',
    groupId: 2,
    roleInGroup: 'analyst',
  },
  {
    email: 'mentor.charlie+demo03@example.com',
    password: 'NewsQuest#03',
    displayName: 'Mentor Charlie',
    groupId: 3,
    roleInGroup: 'mentor',
  },
]

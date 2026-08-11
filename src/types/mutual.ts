export interface MutualParticipant {
  id: string
  accountId: string
  rate: number
  userId?: string
  defaultAssetId?: string
}

export interface MutualPurpose {
  id: string
  title: string
  icon: string
  isSettlement?: boolean
}

export interface Mutual {
  id: string
  title: string
  participants: MutualParticipant[]
  purposes: MutualPurpose[]
  status?: 'pending' | 'active' | 'declined'
  createdBy?: string
  memberUserIds?: string[]
  pendingInviteEmails?: string[]
  type?: 'shared-expenses' | 'loan'
  counterpartyName?: string
  lenderAccountId?: string
}

export interface MutualInvitation {
  id: string
  mutualId: string
  mutualTitle: string
  inviterUserId: string
  inviterName: string
  inviterAccountId: string
  inviterAccountTitle: string
  inviterRate: number
  inviteeEmail: string
  inviteeRate: number
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Date | null
}

export interface CreateMutualOptions {
  createdBy: string
  creatorName: string
  inviteeEmail?: string
  inviteeRate?: number
  type?: 'shared-expenses' | 'loan'
  counterpartyName?: string
}

export interface MutualOperation {
  id: string
  accountId: string
  assetId: string
  assetTitle: string
  accountTitle: string
  userId: string
  userName: string
  type: 'payment' | 'income' | 'transfer'
  title: string
  amount: number
  category: string
  comment: string
  datetime: Date
  purposeId: string
  purposeTitle: string
  purposeIcon: string
  settlementId?: string
  settlementDirection?: 'outgoing' | 'incoming'
}

export interface SettlementData {
  accountId: string
  accountTitle: string
  rate: number
  totalExpenses: number
  expectedShare: number
  actualPayments: number
  owes: number // positive means they owe, negative means they are owed
}

export interface AppliedSettlement {
  id: string
  mutualId: string
  fromAccountId: string
  fromAccountTitle: string
  fromAssetId: string | null
  fromAssetTitle: string | null
  toAccountId: string
  toAccountTitle: string
  toAssetId: string | null
  toAssetTitle: string | null
  amount: number
  appliedAt: Date
  createdAt: Date | null
  createdBy: string
  createdByName: string
  settlementPurposeId: string
  scopePurposeId: string | null
  scopePurposeTitle: string
  sourceOperationId: string | null
  targetOperationId: string | null
  isLegacy: boolean
}

export interface ApplySettlementTransferData {
  fromAccountId: string
  fromAccountTitle: string
  fromAssetId: string
  fromAssetTitle: string
  toAccountId: string
  toAccountTitle: string
  toAssetId: string
  toAssetTitle: string
  amount: number
  appliedAt: Date
  createdBy: string
  createdByName: string
  settlementPurposeId: string
  scopePurposeId: string | null
  scopePurposeTitle: string
}


export interface MutualParticipant {
  id: string
  accountId: string
  rate: number
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


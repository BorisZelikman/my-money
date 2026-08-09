export type LoanEntryKind = 'opening-balance' | 'advance' | 'repayment'

export interface LoanEntry {
  id: string
  mutualId: string
  ledgerId: string
  kind: LoanEntryKind
  lenderAccountId: string
  lenderAccountTitle: string
  lenderAssetId: string | null
  lenderAssetTitle: string | null
  borrowerAccountId: string
  borrowerAccountTitle: string
  borrowerAssetId: string | null
  borrowerAssetTitle: string | null
  amount: number
  currency: string
  occurredAt: Date
  createdAt: Date | null
  createdBy: string
  createdByName: string
  comment: string
  sourceOperationId: string | null
  targetOperationId: string | null
}

export interface LoanLedger {
  id: string
  mutualId: string
  lenderAccountId: string
  lenderAccountTitle: string
  borrowerAccountId: string
  borrowerAccountTitle: string
  currency: string
  balance: number
  createdAt: Date | null
  updatedAt: Date | null
  createdBy: string
  memberUserIds: string[]
  entries: LoanEntry[]
}

export interface CreateLoanEntryData {
  kind: LoanEntryKind
  lenderAccountId: string
  lenderAccountTitle: string
  lenderAssetId: string | null
  lenderAssetTitle: string | null
  borrowerAccountId: string
  borrowerAccountTitle: string
  borrowerAssetId: string | null
  borrowerAssetTitle: string | null
  amount: number
  currency: string
  occurredAt: Date
  createdBy: string
  createdByName: string
  memberUserIds: string[]
  comment: string
}

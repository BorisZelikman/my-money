import type { OperationType } from './operation'

export interface UserAccount {
  id: string
  switched: boolean
}

export interface UserAsset {
  id: string
  hide?: boolean
  index?: number
}

export interface UserPreferences {
  id: string
  name: string
  mainCurrency: string
  accounts: UserAccount[]
  assets: UserAsset[]
  mutuals: string[]
  currentAccountId?: string
  currentAssetId?: string
  transferToAssetId?: string
  creditAssetId?: string
  operationType: OperationType
  currentPurpose?: string
  viewMode: 'Accounts' | 'Assets'
  lastViewedPage: string
}

export interface UserBasic {
  id: string
  name: string
}


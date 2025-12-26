export interface Asset {
  id: string
  accountId: string
  title: string
  currency: string
  amount: number
  comment: string
}

export interface AssetWithAccount extends Asset {
  accountTitle: string
}


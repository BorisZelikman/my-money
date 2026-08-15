import type { Operation } from '@/types'

export interface LocatedOperation extends Operation {
  accountId: string
  assetId: string
}

export interface Account {
  id: string
  title: string
  users: string[]
}

export interface AccountWithUsers extends Account {
  userNames: string[]
}


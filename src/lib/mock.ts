export type Role = 'user' | 'admin' | 'auditor'
export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Received Transfer'
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed'

export interface Account {
  id: string
  number: string
  name: string
  type: string
  balance: number
  status: 'Active' | 'Pending' | 'Suspended'
  createdAt: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  status: TransactionStatus
  account: string
}

export const demoAccounts: Account[] = [
  { id: 'acc-1', number: 'BV•••• 4821', name: 'Aarav Mehta', type: 'Primary account', balance: 248650, status: 'Active', createdAt: '12 Jan 2024' },
  { id: 'acc-2', number: 'BV•••• 9130', name: 'Aarav Mehta', type: 'Growth account', balance: 98200, status: 'Active', createdAt: '08 Mar 2024' },
]

export const demoTransactions: Transaction[] = [
  { id: 'TX-10482', type: 'Received Transfer', amount: 28500, description: 'From Priya Sharma', date: 'Today, 10:42 AM', status: 'Completed', account: 'BV•••• 4821' },
  { id: 'TX-10481', type: 'Withdrawal', amount: -8500, description: 'Monthly expenses', date: 'Yesterday, 6:20 PM', status: 'Completed', account: 'BV•••• 4821' },
  { id: 'TX-10480', type: 'Deposit', amount: 75000, description: 'Salary credit · June', date: '20 Jun 2024', status: 'Completed', account: 'BV•••• 4821' },
  { id: 'TX-10479', type: 'Transfer', amount: -12000, description: 'Rent payment', date: '18 Jun 2024', status: 'Completed', account: 'BV•••• 4821' },
  { id: 'TX-10478', type: 'Deposit', amount: 35000, description: 'Freelance project', date: '12 Jun 2024', status: 'Pending', account: 'BV•••• 9130' },
  { id: 'TX-10477', type: 'Withdrawal', amount: -2400, description: 'Subscription bundle', date: '10 Jun 2024', status: 'Failed', account: 'BV•••• 4821' },
]

export const navItems = [
  { label: 'Overview', path: '/dashboard', icon: 'grid' },
  { label: 'Accounts', path: '/accounts', icon: 'wallet' },
  { label: 'Transactions', path: '/transactions', icon: 'list' },
  { label: 'Deposit', path: '/deposit', icon: 'arrow-down' },
  { label: 'Withdraw', path: '/withdraw', icon: 'arrow-up' },
  { label: 'Transfer', path: '/transfer', icon: 'send' },
]

export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(amount))

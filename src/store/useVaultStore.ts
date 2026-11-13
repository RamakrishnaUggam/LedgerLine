import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoAccounts, demoTransactions, formatINR } from '../lib/mock'
import type { Account, Transaction } from '../lib/mock'

interface VaultState {
  accounts: Account[]
  transactions: Transaction[]
  theme: 'light' | 'dark'
  balanceVisible: boolean
  toggleTheme: () => void
  toggleBalance: () => void
  deposit: (accountId: string, amount: number, description: string) => void
  withdraw: (accountId: string, amount: number, description: string) => boolean
  transfer: (accountId: string, amount: number, description: string) => boolean
}

export const useVaultStore = create<VaultState>()(persist((set, get) => ({
  accounts: demoAccounts,
  transactions: demoTransactions,
  theme: 'light',
  balanceVisible: true,
  toggleTheme: () => set((state) => {
    const theme = state.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('balancevault-theme', theme)
    return { theme }
  }),
  toggleBalance: () => set((state) => ({ balanceVisible: !state.balanceVisible })),
  deposit: (accountId, amount, description) => set((state) => ({
    accounts: state.accounts.map((account) => account.id === accountId ? { ...account, balance: account.balance + amount } : account),
    transactions: [{
      id: `TX-${10483 + state.transactions.length}`, type: 'Deposit', amount, description: description || 'Manual deposit',
      date: 'Just now', status: 'Completed', account: state.accounts.find((item) => item.id === accountId)?.number ?? '',
    }, ...state.transactions],
  })),
  withdraw: (accountId, amount, description) => {
    const account = get().accounts.find((item) => item.id === accountId)
    if (!account || account.balance < amount) return false
    set((state) => ({
      accounts: state.accounts.map((item) => item.id === accountId ? { ...item, balance: item.balance - amount } : item),
      transactions: [{
        id: `TX-${10483 + state.transactions.length}`, type: 'Withdrawal', amount: -amount, description: description || 'Manual withdrawal',
        date: 'Just now', status: 'Completed', account: account.number,
      }, ...state.transactions],
    }))
    return true
  },
  transfer: (accountId, amount, description) => {
    const account = get().accounts.find((item) => item.id === accountId)
    if (!account || account.balance < amount) return false
    set((state) => ({
      accounts: state.accounts.map((item) => item.id === accountId ? { ...item, balance: item.balance - amount } : item),
      transactions: [{
        id: `TX-${10483 + state.transactions.length}`, type: 'Transfer', amount: -amount, description: description || 'Internal transfer',
        date: 'Just now', status: 'Completed', account: account.number,
      }, ...state.transactions],
    }))
    return true
  },
}), {
  name: 'balancevault-demo-state',
  partialize: (state) => ({
    accounts: state.accounts,
    transactions: state.transactions,
    theme: state.theme,
  }),
}))

export const maskedBalance = (visible: boolean, amount: number) => visible ? formatINR(amount) : '₹ ••••••'

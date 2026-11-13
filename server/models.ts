import mongoose, { Schema } from 'mongoose'

export type UserRole = 'user' | 'admin' | 'auditor'
export type AccountStatus = 'Pending' | 'Active' | 'Suspended'
export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Received Transfer'
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed'

const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin', 'auditor'], default: 'user', index: true },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true })

const accountSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  number: { type: String, required: true, unique: true },
  name: { type: String, default: 'BalanceVault account' },
  type: { type: String, default: 'Primary account' },
  balance: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Pending', 'Active', 'Suspended'], default: 'Pending', index: true },
}, { timestamps: true })

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  type: { type: String, enum: ['Deposit', 'Withdrawal', 'Transfer', 'Received Transfer'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true, trim: true, maxlength: 160 },
  status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' },
  reference: { type: String, required: true, unique: true },
  counterpartyAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
}, { timestamps: true })

const auditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, maxlength: 120 },
  resource: { type: String, required: true, maxlength: 120 },
  metadata: { type: Schema.Types.Mixed },
  ipAddress: { type: String, maxlength: 80 },
}, { timestamps: true })

export const User = mongoose.models.User ?? mongoose.model('User', userSchema)
export const Account = mongoose.models.Account ?? mongoose.model('Account', accountSchema)
export const Transaction = mongoose.models.Transaction ?? mongoose.model('Transaction', transactionSchema)
export const AuditLog = mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditLogSchema)

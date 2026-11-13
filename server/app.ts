import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { createClient } from 'redis'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'

import { config } from './config.js'
import { databaseReady } from './db.js'
import { Account, AuditLog, Transaction, User } from './models.js'
import { createToken, hashPassword, publicUser, requireAuth, requireRole, verifyPassword, type AuthRequest } from './auth.js'

const app = express()
const redis = config.REDIS_URL ? createClient({ url: config.REDIS_URL }) : null
if (redis) redis.connect().catch((error: unknown) => console.error('Redis connection failed:', error))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ...(redis ? { store: new RedisStore({ sendCommand: (...args: string[]) => redis.sendCommand(args) }) } : {}),
})

app.use(helmet())
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(limiter)

const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const moneySchema = z.object({ accountId: z.string().min(1), amount: z.coerce.number().positive(), description: z.string().trim().max(160).optional(), recipientAccountNumber: z.string().trim().optional() })
async function audit(request: AuthRequest, action: string, resource: string, metadata?: unknown) {
  await AuditLog.create({ actorId: request.user?.id, action, resource, metadata, ipAddress: request.ip })
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'balancevault-api', timestamp: new Date().toISOString() }))
app.get('/api/ready', (_request, response) => response.status(databaseReady() ? 200 : 503).json({ status: databaseReady() ? 'ready' : 'not-ready', database: databaseReady() }))

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const body = registerSchema.parse(request.body)
    const exists = await User.exists({ email: body.email.toLowerCase() })
    if (exists) return response.status(409).json({ message: 'An account with that email already exists' })
    const user = await User.create({ ...body, email: body.email.toLowerCase(), passwordHash: await hashPassword(body.password) })
    const account = await Account.create({ userId: user.id, number: `BV${randomBytes(4).toString('hex').toUpperCase()}`, status: 'Active' })
    await AuditLog.create({ actorId: user.id, action: 'user.registered', resource: user.id, ipAddress: request.ip })
    return response.status(201).json({ user: publicUser(user), account, token: createToken({ id: user.id, role: user.role, email: user.email }) })
  } catch (error) { return next(error) }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const body = loginSchema.parse(request.body)
    const user = await User.findOne({ email: body.email.toLowerCase() }).select('+passwordHash')
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) return response.status(401).json({ message: 'Invalid email or password' })
    await AuditLog.create({ actorId: user.id, action: 'user.logged_in', resource: user.id, ipAddress: request.ip })
    return response.json({ user: publicUser(user), token: createToken({ id: user.id, role: user.role, email: user.email }) })
  } catch (error) { return next(error) }
})

app.get('/api/auth/me', requireAuth, async (request: AuthRequest, response, next) => {
  try {
    const user = await User.findById(request.user?.id)
    if (!user) return response.status(404).json({ message: 'User not found' })
    return response.json({ user: publicUser(user) })
  } catch (error) { return next(error) }
})

app.get('/api/accounts', requireAuth, async (request: AuthRequest, response, next) => {
  try {
    const filter = request.user?.role === 'user' ? { userId: request.user.id } : {}
    return response.json({ accounts: await Account.find(filter).sort({ createdAt: -1 }) })
  } catch (error) { return next(error) }
})
app.post('/api/accounts', requireAuth, async (request: AuthRequest, response, next) => {
  try {
    const body = z.object({ type: z.string().trim().min(2).max(80).default('Savings account') }).parse(request.body)
    const account = await Account.create({ userId: request.user?.id, number: `BV${randomBytes(4).toString('hex').toUpperCase()}`, type: body.type, status: 'Pending' })
    await audit(request, 'account.requested', account.id)
    return response.status(201).json({ account })
  } catch (error) { return next(error) }
})

app.get('/api/transactions', requireAuth, async (request: AuthRequest, response, next) => {
  try {
    const filter = request.user?.role === 'user' ? { userId: request.user.id } : {}
    return response.json({ transactions: await Transaction.find(filter).sort({ createdAt: -1 }).limit(200) })
  } catch (error) { return next(error) }
})

async function applyMoneyAction(request: AuthRequest, response: express.Response, type: 'Deposit' | 'Withdrawal' | 'Transfer') {
  const body = moneySchema.parse(request.body)
  const account = await Account.findOne({ _id: body.accountId, userId: request.user?.id, status: 'Active' })
  if (!account) return response.status(404).json({ message: 'Active account not found' })
  if (type !== 'Deposit' && account.balance < body.amount) return response.status(400).json({ message: 'Insufficient available balance' })
  if (type === 'Transfer') {
    if (!body.recipientAccountNumber) return response.status(400).json({ message: 'Recipient account number is required' })
    const recipient = await Account.findOne({ number: body.recipientAccountNumber, status: 'Active' })
    if (!recipient || recipient.id === account.id) return response.status(400).json({ message: 'Valid recipient account is required' })
    const sender = await Account.findOneAndUpdate({ _id: account.id, balance: { $gte: body.amount } }, { $inc: { balance: -body.amount } }, { new: true })
    if (!sender) return response.status(400).json({ message: 'Insufficient available balance' })
    await Account.findByIdAndUpdate(recipient.id, { $inc: { balance: body.amount } })
    const reference = `TX-${Date.now()}-${randomBytes(2).toString('hex')}`
    const transaction = await Transaction.create({ userId: request.user?.id, accountId: sender.id, type, amount: -body.amount, description: body.description || 'Internal transfer', reference, counterpartyAccountId: recipient.id })
    await Transaction.create({ userId: recipient.userId, accountId: recipient.id, type: 'Received Transfer', amount: body.amount, description: body.description || 'Received transfer', reference: `${reference}-R`, counterpartyAccountId: sender.id })
    await audit(request, 'transaction.transfer', transaction.id, { amount: body.amount, recipientAccountNumber: recipient.number })
    return response.status(201).json({ account: sender, transaction })
  }
  account.balance += type === 'Deposit' ? body.amount : -body.amount
  await account.save()
  const transaction = await Transaction.create({ userId: request.user?.id, accountId: account.id, type, amount: type === 'Deposit' ? body.amount : -body.amount, description: body.description || `Manual ${type.toLowerCase()}`, reference: `TX-${Date.now()}-${randomBytes(2).toString('hex')}` })
  await audit(request, `transaction.${type.toLowerCase()}`, transaction.id, { amount: body.amount })
  return response.status(201).json({ account, transaction })
}

app.post('/api/actions/deposit', requireAuth, async (request: AuthRequest, response, next) => {
  try { return await applyMoneyAction(request, response, 'Deposit') } catch (error) { return next(error) }
})
app.post('/api/actions/withdraw', requireAuth, async (request: AuthRequest, response, next) => {
  try { return await applyMoneyAction(request, response, 'Withdrawal') } catch (error) { return next(error) }
})
app.post('/api/actions/transfer', requireAuth, async (request: AuthRequest, response, next) => {
  try { return await applyMoneyAction(request, response, 'Transfer') } catch (error) { return next(error) }
})

app.get('/api/admin/users', requireAuth, requireRole('admin'), async (_request, response, next) => {
  try { return response.json({ users: await User.find().sort({ createdAt: -1 }).select('-passwordHash') }) } catch (error) { return next(error) }
})
app.patch('/api/admin/accounts/:id/status', requireAuth, requireRole('admin'), async (request, response, next) => {
  try {
    const status = z.object({ status: z.enum(['Pending', 'Active', 'Suspended']) }).parse(request.body).status
    const account = await Account.findByIdAndUpdate(request.params.id, { status }, { new: true })
    if (account) await audit(request, 'account.status_changed', account.id, { status })
    return account ? response.json({ account }) : response.status(404).json({ message: 'Account not found' })
  } catch (error) { return next(error) }
})
app.get('/api/auditor/records', requireAuth, requireRole('auditor', 'admin'), async (_request, response, next) => {
  try { return response.json({ transactions: await Transaction.find().sort({ createdAt: -1 }).limit(500), accounts: await Account.find().limit(500), auditLogs: await AuditLog.find().sort({ createdAt: -1 }).limit(500) }) } catch (error) { return next(error) }
})

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ message: 'Invalid request', issues: error.issues })
  console.error(error)
  return response.status(500).json({ message: 'Internal server error' })
})

export default app

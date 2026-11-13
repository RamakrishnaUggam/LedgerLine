import { connectDatabase, disconnectDatabase } from './db.js'
import { hashPassword } from './auth.js'
import { User } from './models.js'

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  const auditorEmail = process.env.SEED_AUDITOR_EMAIL
  const auditorPassword = process.env.SEED_AUDITOR_PASSWORD
  if (!adminEmail || !adminPassword || !auditorEmail || !auditorPassword) throw new Error('Set all SEED_ADMIN_* and SEED_AUDITOR_* variables before seeding')

  await connectDatabase()
  await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    { firstName: 'BalanceVault', lastName: 'Admin', email: adminEmail.toLowerCase(), passwordHash: await hashPassword(adminPassword), role: 'admin', isVerified: true },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
  await User.findOneAndUpdate(
    { email: auditorEmail.toLowerCase() },
    { firstName: 'BalanceVault', lastName: 'Auditor', email: auditorEmail.toLowerCase(), passwordHash: await hashPassword(auditorPassword), role: 'auditor', isVerified: true },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
  console.log('Seeded admin and auditor users')
  await disconnectDatabase()
}

seed().catch((error: unknown) => {
  console.error('Unable to seed users:', error)
  process.exitCode = 1
})

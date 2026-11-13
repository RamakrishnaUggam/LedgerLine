import app from './app.js'

import { config } from './config.js'
import { connectDatabase } from './db.js'

async function start() {
  await connectDatabase()
  app.listen(config.PORT, () => console.log(`BalanceVault API listening on http://localhost:${config.PORT}`))
}

start().catch((error: unknown) => {
  console.error('Unable to start BalanceVault API:', error)
  process.exitCode = 1
})

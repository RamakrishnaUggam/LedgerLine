import app from '../server/app.js'
import { connectDatabase } from '../server/db.js'

let databaseConnection: Promise<void> | undefined

export default async function handler(request: Parameters<typeof app>[0], response: Parameters<typeof app>[1]) {
  databaseConnection ??= connectDatabase()
  await databaseConnection
  return app(request, response)
}

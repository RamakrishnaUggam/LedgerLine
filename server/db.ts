import mongoose from 'mongoose'

import { config } from './config.js'

export async function connectDatabase() {
  await mongoose.connect(config.MONGODB_URI)
}

export function databaseReady() {
  return mongoose.connection.readyState === 1
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

import 'dotenv/config'

import { z } from 'zod'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/balancevault'),
  JWT_SECRET: z.string().min(16).default('balancevault-development-secret-change-me'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  REDIS_URL: z.string().optional(),
})

export const config = configSchema.parse(process.env)

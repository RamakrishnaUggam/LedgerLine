import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'

import { config } from './config.js'
import { User, type UserRole } from './models.js'

export type AuthRequest = Request & { user?: { id: string; role: UserRole; email: string } }

export function createToken(user: { id: string; role: UserRole; email: string }) {
  return jwt.sign(user, config.JWT_SECRET, { expiresIn: '7d' })
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return response.status(401).json({ message: 'Authentication required' })
  try {
    request.user = jwt.verify(token, config.JWT_SECRET) as AuthRequest['user']
    return next()
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: AuthRequest, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) return response.status(403).json({ message: 'Insufficient permissions' })
    return next()
  }
}

export function publicUser(user: InstanceType<typeof User>) {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, isVerified: user.isVerified }
}

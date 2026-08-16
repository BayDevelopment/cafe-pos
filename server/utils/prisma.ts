import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('FATAL: DATABASE_URL tidak ditemukan di environment variables.')
}

const pool = new pg.Pool({ connectionString })

pool.on('error', (err) => {
  console.error('[prisma] Unexpected error on idle PostgreSQL client:', err)
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// --- GRACEFUL SHUTDOWN: tangani SIGTERM & SIGINT, bukan cuma beforeExit ---
let isShuttingDown = false
async function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`[prisma] Menerima ${signal}, menutup koneksi database...`)
  try {
    await prisma.$disconnect()
    await pool.end()
  } catch (err) {
    console.error('[prisma] Error saat shutdown:', err)
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('beforeExit', () => shutdown('beforeExit'))
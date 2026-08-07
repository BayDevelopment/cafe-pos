// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// --- PENGAMANAN: Pastikan URL database tersedia ---
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('FATAL: DATABASE_URL tidak ditemukan di environment variables.')
}

// --- INISIALISASI KONEKSI DATABASE (PostgreSQL) ---
const pool = new pg.Pool({ connectionString })

// --- WAJIB: tangani error idle client, tanpa ini error koneksi bisa crash seluruh proses ---
pool.on('error', (err) => {
    console.error('[prisma] Unexpected error on idle PostgreSQL client:', err)
})

const adapter = new PrismaPg(pool)

// --- MENCEGAH KEBOCORAN KONEKSI SAAT HOT-RELOAD (DEV MODE) ---
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

// --- GRACEFUL SHUTDOWN: tutup koneksi dengan bersih saat proses berhenti ---
process.on('beforeExit', async () => {
    await prisma.$disconnect()
})
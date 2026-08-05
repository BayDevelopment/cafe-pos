// server/utils/db.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL

// Buat pool koneksi menggunakan driver 'pg'
const pool = new pg.Pool({ connectionString })

// Masukkan adapter ke dalam constructor PrismaClient
const adapter = new PrismaPg(pool)
export const db = new PrismaClient({ adapter })
// src/utils/prisma.js
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.warn('WARNING: DATABASE_URL not set in .env');
}

// create adapter and pass it to PrismaClient
const adapter = new PrismaPg({ connectionString });

let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  // prevent creating infinite clients in dev (hot reload)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({ adapter });
  }
  prisma = global.__prisma;
}

module.exports = prisma;

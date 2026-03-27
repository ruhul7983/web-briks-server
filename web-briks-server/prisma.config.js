// prisma/prisma.config.js
require('dotenv/config');
const { defineConfig, env } = require('@prisma/config');

module.exports = defineConfig({
  schema: './prisma/schema.prisma',    // correct path

  migrations: {
    path: 'prisma/migrations',
  },

  datasource: {
    provider: 'postgresql',            // MUST be included
    url: env('DATABASE_URL'),          // MUST be included
  },
});

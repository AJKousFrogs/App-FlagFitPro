import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.VITE_DATABASE_URL
  },
  verbose: true,
  strict: true,
});
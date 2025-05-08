import { config } from 'dotenv'

config({ path: '.env' })

export function appOptions() {
  return {
    jwtSecret: new TextEncoder().encode(process.env['NUXT_JWT_SECRET'] || '?'),
    chromeUrl: process.env['NUXT_CHROME_URL'] || '?',
    appInternalUrl: process.env['NUXT_APP_INTERNAL_URL'] || '?',
    appClientId: process.env['NUXT_APP_CLIENT_ID'] || '?',
    appClientSecret: process.env['NUXT_APP_CLIENT_SECRET'] || '?'
  }
}

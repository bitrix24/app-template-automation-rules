import { config } from 'dotenv'
import type { RabbitMQConfig } from '@bitrix24/b24rabbitmq'

config({ path: '.env' })

const base = 'activities'
const entity = 'activity'
const activityCode = 'PdfFromHtml'
const ver = 'v1'
const delayedMs = 6000
const failedRoutingKey = 'failed'

export function appOptions() {
  return {
    jwtSecret: new TextEncoder().encode(process.env['NUXT_JWT_SECRET'] || '?'),
    chromeUrl: process.env['NUXT_CHROME_URL'] || '?',
    appInternalUrl: process.env['NUXT_APP_INTERNAL_URL'] || '?',
    appClientId: process.env['NUXT_APP_CLIENT_ID'] || '?',
    appClientSecret: process.env['NUXT_APP_CLIENT_SECRET'] || '?',
    appScope: process.env['NUXT_APP_SCOPE'] || '?',
    rabbitmqUrl: process.env['NUXT_RABBITMQ_URL'] || '?',
    activityCode,
    ver,
    queueName: `${entity}.${activityCode}.${ver}`,
    exchangeService: `${base}.service.${ver}`,
    delayRoutingKey: `delay.${activityCode}.${delayedMs}`,
    failedRoutingKey,
  }
}

// @memo Need sync with frontend/server/rabbitmq.config.ts
export const rabbitMQConfig: RabbitMQConfig = {
  connection: {
    url: appOptions().rabbitmqUrl,
    reconnectInterval: 5000,
    maxRetries: 5
  },
  exchanges: [
    {
      name: `${base}.${ver}`,
      type: 'direct',
      options: { durable: true }
    },
    {
      name: appOptions().exchangeService,
      type: 'direct',
      options: { durable: true }
    }
  ],
  queues: [
    // Main queue (room)
    {
      name: appOptions().queueName,
      options: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': appOptions().exchangeService,
          'x-dead-letter-routing-key': appOptions().failedRoutingKey
        }
      },
      bindings: [
        {
          exchange: `${base}.${ver}`,
          routingKey: `${entity}.${activityCode}`
        },
        {
          exchange: appOptions().exchangeService,
          routingKey: `${entity}.service.${activityCode}`
        }
      ]
    },
    // Queue with delay (balcony)
    {
      name: `${entity}.${activityCode}.delayed.${delayedMs}.${ver}`,
      options: {
        durable: true,
        arguments: {
          'x-message-ttl': delayedMs,
          'x-dead-letter-exchange': appOptions().exchangeService,
          'x-dead-letter-routing-key': `${entity}.service.${activityCode}`
        }
      },
      bindings: [
        {
          exchange: appOptions().exchangeService,
          routingKey: appOptions().delayRoutingKey
        }
      ]
    },
    // Queue of problematic messages (vegetable garden)
    {
      name: `${base}.${appOptions().failedRoutingKey}.${ver}`,
      options: { durable: true },
      bindings: [
        {
          exchange: appOptions().exchangeService,
          routingKey:  appOptions().failedRoutingKey
        }
      ]
    }
  ],
  channel: {
    prefetchCount: 1
  }
}

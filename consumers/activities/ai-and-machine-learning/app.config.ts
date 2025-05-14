import { config } from 'dotenv'
import type { RabbitMQConfig } from '@bitrix24/b24rabbitmq'

config({ path: '.env' })

export function appOptions() {
  return {
    jwtSecret: new TextEncoder().encode(process.env['NUXT_JWT_SECRET'] || '?'),
    chromeUrl: process.env['NUXT_CHROME_URL'] || '?',
    appInternalUrl: process.env['NUXT_APP_INTERNAL_URL'] || '?',
    appClientId: process.env['NUXT_APP_CLIENT_ID'] || '?',
    appClientSecret: process.env['NUXT_APP_CLIENT_SECRET'] || '?',
    rabbitmqUrl: process.env['NUXT_RABBITMQ_URL'] || '?'
  }
}

export const rabbitMQConfig: RabbitMQConfig = {
  connection: {
    url: appOptions().rabbitmqUrl,
    reconnectInterval: 5000,
    maxRetries: 5
  },
  exchanges: [
    {
      name: 'activities',
      type: 'direct',
      options: { durable: true }
    }
  ],
  queues: [
    {
      name: 'activity.AIandMachineLearning',
      bindings: [
        {
          exchange: 'activities',
          routingKey: 'activity.AIandMachineLearning'
        }
      ],
      options: { durable: true }
    }
  ],
  channel: {
    prefetchCount: 1
  }
}

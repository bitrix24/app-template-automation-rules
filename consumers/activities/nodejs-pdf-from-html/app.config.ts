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

// @memo Need sync with frontend/server/rabbitmq.config.ts
export const rabbitMQConfig: RabbitMQConfig = {
  connection: {
    url: appOptions().rabbitmqUrl,
    reconnectInterval: 5000,
    maxRetries: 5
  },
  exchanges: [
    {
      name: 'activities.v1',
      type: 'direct',
      options: { durable: true }
    },
    {
      name: 'activities.service.v1',
      type: 'direct',
      options: { durable: true }
    }
  ],
  queues: [
    // Main queue (room)
    {
      name: 'activity.AIandMachineLearning.v1',
      options: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'activities.service.v1',
          'x-dead-letter-routing-key': 'failed'
        }
      },
      bindings: [
        {
          exchange: 'activities.v1',
          routingKey: 'activity.AIandMachineLearning'
        },
        {
          exchange: 'activities.service.v1',
          routingKey: 'activity.service.AIandMachineLearning'
        }
      ]
    },
    // Queue with delay (balcony)
    {
      name: 'activity.AIandMachineLearning.delayed.6000.v1',
      options: {
        durable: true,
        arguments: {
          'x-message-ttl': 6000,
          'x-dead-letter-exchange': 'activities.service.v1',
          'x-dead-letter-routing-key': 'activity.service.AIandMachineLearning'
        }
      },
      bindings: [
        {
          exchange: 'activities.service.v1',
          routingKey: 'delay.AIandMachineLearning.6000'
        }
      ]
    },
    // Queue of problematic messages (vegetable garden)
    {
      name: 'activities.failed.v1',
      options: { durable: true },
      bindings: [
        {
          exchange: 'activities.service.v1',
          routingKey: 'failed'
        }
      ]
    }
  ],
  channel: {
    prefetchCount: 1
  }
}

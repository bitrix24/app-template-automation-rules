import { config } from 'dotenv'
import type { RabbitMQConfig } from '@bitrix24/b24rabbitmq'

config({ path: '.env' })
/**
 * @todo fix this - test for Docker
 */
console.warn('Config env', {
  NUXT_RABBITMQ_URL: process.env['NUXT_RABBITMQ_URL'] || '?'
})

const rabbitmqUrl = process.env['NUXT_RABBITMQ_URL'] || '?'

export const rabbitMQConfig: RabbitMQConfig = {
  connection: {
    url: rabbitmqUrl,
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

import { config } from 'dotenv'
import type { RabbitMQConfig } from '@bitrix24/b24rabbitmq'
import { Salt } from '~/services/salt'

config({ path: '.env' })
/**
 * @todo fix this - test for Docker
 */
console.warn('Config env', {
  NUXT_RABBITMQ_URL: process.env?.NUXT_RABBITMQ_URL || '?'
})

const { addSalt } = Salt()
const rabbitmqUrl = process.env?.NUXT_RABBITMQ_URL || '?'

export const rabbitMQConfig: RabbitMQConfig = {
  connection: {
    url: rabbitmqUrl,
    reconnectInterval: 5000,
    maxRetries: 5
  },
  exchanges: [
    {
      name: addSalt('activities'),
      type: 'direct',
      options: { durable: true }
    }
  ],
  queues: [
    {
      name: addSalt('activity.AIandMachineLearning'),
      bindings: [
        {
          exchange: addSalt('activities'),
          routingKey: addSalt('activity.AIandMachineLearning')
        }
      ],
      options: { durable: true }
    }
  ],
  channel: {
    prefetchCount: 1
  }
}

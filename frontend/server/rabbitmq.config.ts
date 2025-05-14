import type { RabbitMQConfig } from '@bitrix24/b24rabbitmq'

const config = useRuntimeConfig()

export const rabbitMQConfig: RabbitMQConfig = {
  connection: {
    url: config.rabbitmqUrl,
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
  queues: [],
  channel: {
    prefetchCount: 1
  }
}

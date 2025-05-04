import type { RabbitMQConfig } from './types'

const config = useRuntimeConfig()
const rabbitmqUrl = config.rabbitmqUrl

export const exampleConfig: RabbitMQConfig = {
  connection: {
    url: rabbitmqUrl,
    reconnectInterval: 5000,
    maxRetries: 5
  },
  exchanges: [
    {
      name: 'orders',
      type: 'topic',
      options: { durable: true }
    },
    {
      name: 'notifications',
      type: 'fanout',
      options: { autoDelete: true }
    }
  ],
  queues: [
    // @todo test this ////
    {
      name: 'orders',
      bindings: [
        {
          exchange: 'orders'
        }
      ],
      deadLetter: {
        exchange: 'dead_letters',
        routingKey: 'failed_orders'
      }
    },
    // @todo test this ////
    {
      name: 'order_processor',
      bindings: [
        {
          exchange: 'orders',
          routingKey: 'order.*.#'
        }
      ],
      options: { durable: true }
    }
  ],
  channel: {
    prefetchCount: 1
  }
}

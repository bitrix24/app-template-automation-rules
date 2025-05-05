import type amqp from 'amqplib'

export interface ExchangeParams {
  name: string
  type: 'direct' | 'fanout' | 'topic' | 'headers'
  options?: amqp.Options.AssertExchange
}

export interface QueueParams {
  name?: string
  options?: amqp.Options.AssertQueue
  /**
   * Maximum supported priority
   * @default 10
   */
  maxPriority?: number
  bindings: {
    exchange: string
    routingKey?: string
    headers?: Record<string, any>
  }[]
  deadLetter?: {
    exchange: string
    routingKey?: string
  }
}

export interface RabbitMQConfig {
  connection: {
    url: string
    /**
     * @default 5000
     */
    reconnectInterval?: number
    /**
     * @default 5
     */
    maxRetries?: number
  }
  exchanges: ExchangeParams[]
  queues: QueueParams[]
  channel?: {
    // Limit of unconfirmed messages (1)
    prefetchCount?: number
  }
}

export interface Message {
  routingKey: string
  date: string
  entityTypeId?: number
  entityId?: number
  additionalData?: Record<string, any>
}

export interface MessageOptions extends amqp.Options.Publish {
  /**
   * Message priority
   * @min:0
   * @max:10
   *
   * @default 5
   */
  priority?: number
  headers?: Record<string, any>
  [key: string]: any
}

export type MessageHandler<T = any> = (
  msg: T,
  ack: () => void,
  nack: () => void
) => Promise<void>

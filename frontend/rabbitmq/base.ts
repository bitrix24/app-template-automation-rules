import amqp from 'amqplib'
import type { ExchangeParams, QueueParams, RabbitMQConfig } from './types'

export abstract class RabbitMQBase {
  protected connection!: amqp.ChannelModel
  protected channel!: amqp.Channel
  protected config: RabbitMQConfig

  constructor(config: RabbitMQConfig) {
    this.config = {
      channel: { prefetchCount: 1 },
      ...config
    }
  }

  async connect(): Promise<void> {
    throw new Error('Need override this function')
  }

  /**
   * Initialize all exchanges from the config
   * @protected
   */
  protected async setupExchanges(): Promise<void> {
    for (const exchange of this.config.exchanges) {
      await this.registerExchange(exchange)
    }
  }

  async registerExchange(
    exchange: ExchangeParams
  ): Promise<void> {
    await this.channel.assertExchange(
      exchange.name,
      exchange.type,
      exchange.options || {}
    )
  }

  /**
   * Initialize queues from config
   * @protected
   */
  protected async setupQueues(): Promise<void> {
    for (const queue of this.config.queues) {
      await this.registerQueue(queue)
    }
  }

  async registerQueue(
    queue: QueueParams
  ): Promise<amqp.Replies.AssertQueue> {
    let assertsOptions: amqp.Options.AssertQueue = {
      maxPriority: queue.maxPriority ?? 10
    }

    // @todo fix this
    if (assertsOptions.maxPriority) {
      assertsOptions = {
        arguments: {
          'x-max-priority': assertsOptions.maxPriority
        },
        ...assertsOptions
      }
    }

    if (queue.deadLetter) {
      assertsOptions = {
        arguments: {
          'x-dead-letter-exchange': queue.deadLetter.exchange,
          'x-dead-letter-routing-key': queue.deadLetter.routingKey || ''
        },
        ...assertsOptions
      }
    }

    const q = await this.channel.assertQueue(
      queue.name || '',
      {
        ...assertsOptions,
        ...queue.options
      }
    )

    for (const binding of queue.bindings) {
      if (binding.headers) {
        await this.channel.bindQueue(
          q.queue,
          binding.exchange,
          binding.routingKey || '',
          binding.headers
        )
      } else {
        await this.channel.bindQueue(
          q.queue,
          binding.exchange,
          binding.routingKey || ''
        )
      }
    }

    return q
  }

  async disconnect(): Promise<void> {
    await this.channel?.close()
    await this.connection?.close()
    console.log('[RabbitMQ::Base] disconnect')
  }
}

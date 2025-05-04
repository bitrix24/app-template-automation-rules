import amqp from 'amqplib'
import { ExchangeParams, QueueParams, RabbitMQConfig } from './types'

export abstract class RabbitMQBase {
  private retries = 0
  protected exchanges = new Map<string, ExchangeParams>()
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
    try {
      this.connection = await amqp.connect(this.config.connection.url)
      this.channel = await this.connection.createChannel()
      await this.channel.prefetch(this.config.channel!.prefetchCount!)

      this.connection.on(
        'close',
        () => this.handleReconnect()
      )
      console.log('[RabbitMQ] connected successfully')
      this.retries = 0
    } catch (error) {
      console.error('[RabbitMQ] connected error: ', error instanceof Error ? error.message : error)
      this.handleReconnect()
    }
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

  async registerExchange(exchange: ExchangeParams): Promise<void> {
    await this.channel.assertExchange(
      exchange.name,
      exchange.type,
      exchange.options || {}
    )
    this.exchanges.set(exchange.name, exchange)
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

  async registerQueue(queue: QueueParams): Promise<amqp.Replies.AssertQueue> {
    let assertsOptions: amqp.Options.AssertQueue = {
      maxPriority: 10
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

  private handleReconnect(): void {
    if (this.retries >= (this.config.connection.maxRetries || 5)) {
      throw new Error('Max connection retries exceeded')
    }

    setTimeout(() => {
      this.retries++
      console.log(`[RabbitMQ] reconnecting attempt ${this.retries}`)
      this.connect()
    }, this.config.connection.reconnectInterval || 5000)
  }

  async disconnect(): Promise<void> {
    await this.channel?.close()
    await this.connection?.close()
  }
}

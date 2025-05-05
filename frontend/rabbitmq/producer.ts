import amqp from 'amqplib'
import { RabbitMQBase } from './base'
import type { ExchangeParams, MessageOptions } from './types'

export class RabbitMQProducer extends RabbitMQBase {
  private exchanges = new Map<string, ExchangeParams>()

  public async initialize(): Promise<void> {
    await this.connect()
    await this.setupExchanges()
  }

  override async connect(): Promise<void> {
    try {
      console.log('[RabbitMQ::Producer] connect ...')

      this.connection = await amqp.connect(this.config.connection.url)
      this.channel = await this.connection.createChannel()
      await this.channel.prefetch(this.config.channel!.prefetchCount!)
      console.log('[RabbitMQ::Producer] connected successfully')
    } catch (error) {
      const problem = error instanceof Error ? error : new Error(`[RabbitMQ::Producer] connected error`, { cause: error })

      console.error(problem)
      throw problem
    }
  }

  override async registerExchange(
    exchange: ExchangeParams
  ): Promise<void> {
    await super.registerExchange(exchange)
    this.exchanges.set(exchange.name, exchange)
  }

  async publish<T>(
    exchangeName: string,
    routingKey: string,
    message: T,
    options: MessageOptions = {}
  ): Promise<boolean> {
    // if (!this.exchanges.has(exchangeName)) {
    //   throw new Error(`[RabbitMQProducer] Exchange ${exchangeName} not registered`)
    // }

    return this.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        priority: 5,
        ...options
      }
    )
  }
}

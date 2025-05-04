import { RabbitMQBase } from './base'
import type { RabbitMQConfig, MessageOptions } from './types'

export class RabbitMQProducer extends RabbitMQBase {
  constructor(config: RabbitMQConfig) {
    super(config)
    this.initialize()
  }

  private async initialize(): Promise<void> {
    await this.connect()
    await this.setupExchanges()
  }

  async publish<T>(
    exchangeName: string,
    routingKey: string,
    message: T,
    options: MessageOptions = {}
  ): Promise<boolean> {
    if (!this.exchanges.has(exchangeName)) {
      throw new Error(`[RabbitMQProducer] Exchange ${exchangeName} not registered`)
    }

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

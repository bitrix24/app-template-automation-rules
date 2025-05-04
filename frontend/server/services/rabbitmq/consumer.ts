import type amqp from 'amqplib'
import { RabbitMQBase } from './base'
import type { RabbitMQConfig, QueueParams, MessageHandler } from './types'

export class RabbitMQConsumer extends RabbitMQBase {
  private handlers = new Map<string, MessageHandler>()

  constructor(config: RabbitMQConfig) {
    super(config)
    this.initialize()
  }

  private async initialize(): Promise<void> {
    await this.connect()
    await this.setupExchanges()
    await this.setupQueues()
  }

  registerHandler<T>(exchangeName: string, handler: MessageHandler<T>): void {
    this.handlers.set(exchangeName, handler)
  }

  async registerQueue(queue: QueueParams): Promise<amqp.Replies.AssertQueue> {
    const q = await super.registerQueue(queue)

    this.consume(q.queue)

    return q
  }

  async consume(
    queueName: string
  ): Promise<amqp.Replies.Consume> {
    return this.channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return

        const handler = this.handlers.get(msg.fields.exchange)
        if (handler) {
          const content = JSON.parse(msg.content.toString())
          await handler(
            content,
            () => this.channel.ack(msg)
          )
        }
      }
    )
  }
}


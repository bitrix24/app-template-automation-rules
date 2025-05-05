import amqp from 'amqplib'
import { RabbitMQBase } from './base'
import type { MessageHandler } from './types'

export class RabbitMQConsumer extends RabbitMQBase {
  private retries = 0
  private handlers = new Map<string, MessageHandler>()

  public async initialize(): Promise<void> {
    await this.connect()
    await this.setupExchanges()
    await this.setupQueues()
  }

  override async connect(): Promise<void> {
    try {
      console.log('[RabbitMQ::Consumer] connect ...')

      this.connection = await amqp.connect(this.config.connection.url)
      this.channel = await this.connection.createChannel()
      await this.channel.prefetch(this.config.channel!.prefetchCount!)

      this.connection.on(
        'close',
        () => this.handleReconnect()
      )
      console.log('[RabbitMQ::Consumer] connected successfully')
      this.retries = 0
    } catch (error) {
      const problem = error instanceof Error ? error : new Error(`[RabbitMQ::Consumer] connected error`, { cause: error })

      console.error(problem)
      if (problem.message.includes('ENOTFOUND')) {
        throw problem
      }

      this.handleReconnect()
    }
  }

  private handleReconnect(): void {
    if (this.retries >= (this.config.connection.maxRetries || 5)) {
      throw new Error('[RabbitMQ::Consumer] Max connection retries exceeded')
    }

    setTimeout(() => {
      this.retries++
      console.log(`[RabbitMQ::Consumer] reconnecting attempt ${this.retries}`)
      this.connect()
    }, this.config.connection.reconnectInterval || 5000)
  }

  registerHandler<T>(
    queueName: string,
    handler: MessageHandler<T>
  ): void {
    this.handlers.set(queueName, handler)
  }

  unRegisterHandler(queueName: string): void {
    if (this.handlers.has(queueName)) {
      this.handlers.delete(queueName)
    }
  }

  async consume(
    queueName: string
  ): Promise<amqp.Replies.Consume> {
    return this.channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return

        // msg.fields.exchange
        const handler = this.handlers.get(queueName)
        if (handler) {
          try {
            const content = JSON.parse(msg.content.toString())
            await handler(
              content,
              () => this.channel.ack(msg),
              () => this.channel.nack(msg, false, false)
            )
          } catch (error) {
            console.error(`[RabbitMQ] Error processing message: ${error instanceof Error ? error.message : error}`)
            this.channel.nack(msg, false, false)
          }
        }
      }
    )
  }
}

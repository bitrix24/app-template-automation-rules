import { Text } from '@bitrix24/b24jssdk'
import type { RabbitMQProducer } from './producer'
import type { RabbitMQConsumer } from './consumer'

export class RabbitRPC {
  constructor(
    private producer: RabbitMQProducer,
    private consumer: RabbitMQConsumer
  ) {}

  async call<T>(
    exchange: string,
    routingKey: string,
    payload: any,
    timeout = 5000
  ): Promise<T> {
    const correlationId = Text.getUuidRfc4122()
    const replyQueue = await this.consumer.registerQueue({
      name: '',
      bindings: [],
      options: { exclusive: true }
    })

    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('[RabbitRPC] timeout')),
        timeout
      )

      const handler = async (
        msg: any,
        ack: () => void
      ) => {
        if (msg.correlationId === correlationId) {
          clearTimeout(timer)
          ack()
          resolve(msg)
        }
      }

      this.consumer.registerHandler(
        replyQueue.queue,
        handler
      )

      this.producer.publish(
        exchange,
        routingKey,
        payload,
        {
          correlationId,
          replyTo: replyQueue.queue
        }
      )
    })
  }
}

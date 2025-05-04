import { exampleConfig } from './config'
import { RabbitMQProducer } from './producer'
import { RabbitMQConsumer } from './consumer'

const producer = new RabbitMQProducer(exampleConfig)
const consumer = new RabbitMQConsumer(exampleConfig)

// Integrating Metrics into Consumer
// consumer('orders', withMetrics((msg, ack) => {
//   console.log('Processing order:', msg)
//   ack()
// }))

consumer.registerHandler(
  'orders',
  async (msg: { id: number, items: string[] }, ack) => {
    console.log('Processing order:', msg)
    ack()
  }
)

producer.publish(
  'orders',
  'order.created.123',
  {
    id: 123,
    items: ['laptop', 'mouse']
  }
)

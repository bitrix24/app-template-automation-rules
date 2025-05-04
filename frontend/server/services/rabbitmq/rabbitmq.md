### 1. Декораторы для обработчиков

> Для сложных маршрутизаций используйте наследование контроллеров

**Пример использования:**
```typescript
class OrderService {
  @RabbitHandler({ 
    exchange: 'orders', 
    routingKey: 'order.created',
    queue: 'order_processor'
  })
  handleOrderCreated(msg: OrderMessage) {
    console.log('Processing order:', msg.id)
  }
}

// Инициализация
const consumer = new RabbitMQConsumer(config)
consumer.registerHandlers(new OrderService())
```

---

### 2. Priority Queues

> Не используйте более 10 уровней приоритета для лучшей производительности

---

### 3. RPC

> Ограничивайте время ожидания ответа

---

### 4. Метрики

> Экспортируйте данные в Prometheus/Grafana

---

### 5. DLX

> Настройте отдельный обработчик для "мертвых" сообщений

---

### Интеграция всех компонентов
`src/index.ts`
```typescript
// Инициализация
const producer = new RabbitMQProducer(config);
const consumer = new RabbitMQConsumer(config);
const rpc = new RabbitRPC(producer, consumer);

// Метрики
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics();

// Dead-Letter обработчик
consumer.registerHandler('dead_letters', (msg, ack) => {
  console.error('Dead letter received:', msg);
  ack();
});

// Использование RPC
const result = await rpc.call<number>('math', 'sqrt', { value: 25 });
console.log('Result:', result); // 5
```

---

### Архитектурная схема
```
[Producer] → [Exchange] → [Queue]
                   │
                   └─ [Dead Letter Exchange]
                             ↓
                       [Dead Letters Queue]

[Consumer]
  ├─ [Message Handler]
  ├─ [Metrics Collector]
  └─ [RPC Responder]
```

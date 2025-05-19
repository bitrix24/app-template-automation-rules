<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ;

use Bitrix24\RabbitMQ\Types\ExchangeParams;
use Bitrix24\RabbitMQ\Types\QueueParams;
use Bitrix24\RabbitMQ\Types\IBuilderConfig;
use Bitrix24\RabbitMQ\Types\IBuilderConfigSomeRouting;
use Bitrix24\RabbitMQ\Types\IBuilderConfigSomeDelayed;

readonly class BuilderConfigWithDelay
  implements IBuilderConfig, IBuilderConfigSomeRouting, IBuilderConfigSomeDelayed
{
  public function __construct(
    private string $exchangeBaseTitle,
    private string $queueBaseTitle,
    private string $activityCode,
    private string $ver,
    private int    $delayMs = 6000
  )
  {
  }

  // region Info ////
  /**
   * @inheritDoc
   */
  public function getExchange(): string
  {
    return sprintf('%s.%s', $this->exchangeBaseTitle, $this->ver);
  }

  /**
   * @inheritDoc
   */
  public function getServiceExchange(): string
  {
    return sprintf('%s.service.%s', $this->exchangeBaseTitle, $this->ver);
  }

  /**
   * @inheritDoc
   */
  public function getServiceRoutingKey(): string
  {
    return sprintf('%s.service.%s', $this->queueBaseTitle, $this->activityCode);
  }

  /**
   * @inheritDoc
   */
  public function getQueueName(): string
  {
    return sprintf('%s.%s.%s', $this->queueBaseTitle, $this->activityCode, $this->ver);
  }

  /**
   * @inheritDoc
   */
  public function getDelayedQueueName(): string
  {
    return sprintf('%s.%s.delayed.%s.%s', $this->queueBaseTitle, $this->activityCode, $this->delayMs, $this->ver);
  }

  /**
   * @inheritDoc
   */
  public function getFailedQueueName(): string
  {
    return sprintf('%s.failed.%s', $this->exchangeBaseTitle, $this->ver);
  }

  /**
   * @inheritDoc
   */
  public function getRoutingKey(): string
  {
    return sprintf('%s.%s', $this->queueBaseTitle, $this->activityCode);
  }

  /**
   * @inheritDoc
   */
  public function getDelayRoutingKey(): string
  {
    return sprintf('delay.%s.%s', $this->activityCode, $this->delayMs);
  }

  /**
   * @inheritDoc
   */
  public function getFailedRoutingKey(): string
  {
    return 'failed';
  }

  /**
   * @inheritdoc
   */
  public function getDelayMs(): int
  {
    return $this->delayMs;
  }
  // endregion ////

  public function buildExchanges(): array
  {
    return [
      new ExchangeParams(
        $this->getExchange(),
        'direct',
        ['durable' => true]
      ),
      new ExchangeParams(
        $this->getServiceExchange(),
        'direct',
        ['durable' => true]
      )
    ];
  }

  public function buildQueues(): array
  {
    return [
      // Main queue (room)
      new QueueParams(
        $this->getQueueName(),
        [
          'durable' => true,
          'arguments' => [
            'x-dead-letter-exchange' => $this->getServiceExchange(),
            'x-dead-letter-routing-key' => $this->getFailedRoutingKey()
          ]
        ],
        [
          [
            'exchange' => $this->getExchange(),
            'routingKey' => $this->getRoutingKey()
          ],
          [
            'exchange' => $this->getServiceExchange(),
            'routingKey' => $this->getServiceRoutingKey()
          ]
        ]
      ),
      // Queue with delay (balcony)
      new QueueParams(
        $this->getDelayedQueueName(),
        [
          'durable' => true,
          'arguments' => [
            'x-message-ttl' => $this->getDelayMs(),
            'x-dead-letter-exchange' => $this->getServiceExchange(),
            'x-dead-letter-routing-key' => $this->getServiceRoutingKey()
          ]
        ],
        [
          [
            'exchange' => $this->getServiceExchange(),
            'routingKey' => $this->getDelayRoutingKey()
          ]
        ]
      ),
      // Queue of problematic messages (vegetable garden)
      new QueueParams(
        $this->getFailedQueueName(),
        [
          'durable' => true
        ],
        [
          [
            'exchange' => $this->getServiceExchange(),
            'routingKey' => $this->getFailedRoutingKey()
          ]
        ]
      )
    ];
  }
}

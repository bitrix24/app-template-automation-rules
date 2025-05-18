<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Dotenv\Dotenv;
use Bitrix24\RabbitMQ\Types\RabbitMQConfig;
use Bitrix24\RabbitMQ\Types\ExchangeParams;
use Bitrix24\RabbitMQ\Types\QueueParams;

class Config
{
  private static ?self $instance = null;

  public readonly bool $isDev;
  public readonly string $appClientId;
  public readonly string $appClientSecret;
  public readonly string $rabbitmqUrl;
  public readonly RabbitMQConfig $rabbitmqConfig;

  public static function getInstance(): self
  {
    if (self::$instance === null) {
      self::$instance = new self();
    }

    return self::$instance;
  }

  private function __construct() {
    $dotenv = Dotenv::createImmutable(__DIR__.'/..');
    $dotenv->load();

    $this->isDev = ($_ENV['NODE_ENV'] ?? '?') === 'development';
    $this->appClientId = $_ENV['NUXT_APP_CLIENT_ID'] ?? '?';
    $this->appClientSecret = $_ENV['NUXT_APP_CLIENT_SECRET'] ?? '?';
    $this->rabbitmqUrl = $_ENV['NUXT_RABBITMQ_URL'] ?? '?';

    $this->rabbitmqConfig = new RabbitMQConfig(
      [
        'url' => $this->rabbitmqUrl,
        'reconnectInterval' => 5000,
        'maxRetries' => 5
      ],
      [
        new ExchangeParams(
          'activities.v1',
          'direct',
          [ 'durable' => true ]
        ),
        new ExchangeParams(
          'activities.service.v1',
          'direct',
          [ 'durable' => true ]
        )
      ],
      [
        // Main queue (room)
        new QueueParams(
          'activity.CrmEntityTaskCalc.v1',
          [
            'durable' => true,
            'arguments' => [
              'x-dead-letter-exchange' => 'activities.service.v1',
              'x-dead-letter-routing-key' => 'failed'
            ]
          ],
          // @todo remove this
          10,
          [
            [
              'exchange' => 'activities.v1',
              'routingKey' => 'activity.CrmEntityTaskCalc'
            ],
            [
              'exchange' => 'activities.service.v1',
              'routingKey'=> 'activity.service.CrmEntityTaskCalc'
            ]
          ]
        ),
        // Queue with delay (balcony)
        new QueueParams(
          'activity.CrmEntityTaskCalc.delayed.6000.v1',
          [
            'durable' => true,
            'arguments' => [
              'x-message-ttl' => 6000,
              'x-dead-letter-exchange' => 'activities.service.v1',
              'x-dead-letter-routing-key' => 'activity.service.CrmEntityTaskCalc'
            ]
          ],
          // @todo remove this
          10,
          [
            [
              'exchange' => 'activities.service.v1',
              'routingKey'=> 'delay.CrmEntityTaskCalc.6000'
            ]
          ]
        ),
        // Queue of problematic messages (vegetable garden)
        new QueueParams(
          'activities.failed.v1',
          [
            'durable' => true
          ],
          // @todo remove this
          10,
          [
            [
              'exchange' => 'activities.service.v1',
              'routingKey'=> 'failed'
            ]
          ]
        )
      ],
      ['prefetch_count' => 1]
    );
  }

  private function __clone() {}

  /**
   * @throws \Exception
   */
  public function __wakeup()
  {
    throw new \Exception('Cannot unserialize singleton');
  }
}

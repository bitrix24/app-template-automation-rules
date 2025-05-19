<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Bitrix24\RabbitMQ\BuilderConfigWithDelay;
use Bitrix24\RabbitMQ\Types\IBuilderConfig;
use Bitrix24\RabbitMQ\Types\IBuilderConfigSomeDelayed;
use Bitrix24\RabbitMQ\Types\IBuilderConfigSomeRouting;
use Bitrix24\RabbitMQ\Types\RabbitMQConfig;
use Exception;

class ConfigRabbitMQ
{
  public const string exchangeBaseTitle = 'activities';
  public const string queueBaseTitle = 'activity';
  private static array $instance = [];

  public readonly IBuilderConfig & IBuilderConfigSomeRouting & IBuilderConfigSomeDelayed $params;
  public readonly RabbitMQConfig $rabbitmqConfig;

  public static function getInstance(
    string $activityCode,
    string $ver = 'v1'
  ): self
  {
    $key = join('.', [$activityCode, $ver]);
    if (!isset(self::$instance[$key])) {
      self::$instance[$key] = new self(
        $activityCode,
        $ver
      );
    }

    return self::$instance[$key];
  }

  private function __construct(
    string $activityCode,
    string $ver
  ) {

    $this->params = new BuilderConfigWithDelay(
      static::exchangeBaseTitle,
      static::queueBaseTitle,
      $activityCode,
      $ver
    );

    $this->rabbitmqConfig = new RabbitMQConfig(
      [
        'url' => RabbitMQConfig::getConnectionFromUrl(Config::getInstance()->rabbitmqUrl),
        'reconnectInterval' => 5000,
        'maxRetries' => 5
      ],
      $this->params->buildExchanges(),
      $this->params->buildQueues(),
      ['prefetch_count' => 1]
    );
  }

  public function getParams(): IBuilderConfig & IBuilderConfigSomeRouting & IBuilderConfigSomeDelayed {
    return $this->params;
  }

  private function __clone() {}

  /**
   * @throws Exception
   */
  public function __wakeup()
  {
    throw new Exception('Cannot unserialize singleton');
  }
}

<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Dotenv\Dotenv;

class Config
{
  private static ?self $instance = null;

  public readonly bool $isDev;
  public readonly string $appClientId;
  public readonly string $appClientSecret;
  public readonly string $appScope;
  public readonly string $rabbitmqUrl;
  public readonly string $databaseUrl;

  public static function getInstance(): self
  {
    if (self::$instance === null) {
      self::$instance = new self();
    }

    return self::$instance;
  }

  private function __construct()
  {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();

    $this->isDev = ($_ENV['NODE_ENV'] ?? '?') === 'development';
    $this->appClientId = $_ENV['NUXT_APP_CLIENT_ID'] ?? '?';
    $this->appClientSecret = $_ENV['NUXT_APP_CLIENT_SECRET'] ?? '?';
    $this->appScope = $_ENV['NUXT_APP_SCOPE'] ?? '?';
    $this->rabbitmqUrl = $_ENV['NUXT_RABBITMQ_URL'] ?? '?';
    $this->databaseUrl = $_ENV['DATABASE_URL'] ?? '?';
  }

  private function __clone() {}

  /**
   * @throws \LogicException
   */
  public function __wakeup()
  {
    throw new \LogicException('Cannot unserialize singleton');
  }
}

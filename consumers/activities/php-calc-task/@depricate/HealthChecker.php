<?php

declare(strict_types=1);

namespace Consumer\;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use GuzzleHttp\Client;

class HealthChecker {
  public function __construct(
    private array $rabbitConfig,
    private string $telegramToken
  ) {}

  public function check(): bool {
    return $this->checkRabbitMQ() && $this->checkTelegram();
  }

  private function checkRabbitMQ(): bool {
    try {
      $connection = new AMQPStreamConnection(
        $this->rabbitConfig['host'],
        $this->rabbitConfig['port'],
        $this->rabbitConfig['user'],
        $this->rabbitConfig['pass']
      );
      $connection->channel()->close();
      $connection->close();
      return true;
    } catch (\Exception) {
      return false;
    }
  }

  private function checkTelegram(): bool {
    try {
      (new Client())->get(
        sprintf("https://api.telegram.org/bot%s/getMe", $this->telegramToken),
        ['timeout' => 3]
      );
      return true;
    } catch (\Exception) {
      return false;
    }
  }
}

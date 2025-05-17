<?php

declare(strict_types=1);

namespace Consumer\;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class RabbitMQConsumer {
  private AMQPStreamConnection $connection;
  private \PhpAmqpLib\Channel\AMQPChannel $channel;

  public function __construct(
    private array $config,
    private TelegramSender $telegramSender,
    private CircuitBreaker $circuitBreaker
  ) {
    $this->connect();
  }

  private function connect(): void {
    $this->connection = new AMQPStreamConnection(
      $this->config['host'],
      $this->config['port'],
      $this->config['user'],
      $this->config['pass']
    );

    $this->channel = $this->connection->channel();
    $this->channel->queue_declare(
      $this->config['queue'],
      false,
      true,
      false,
      false
    );
  }

  public function consume(): void {
    $callback = function (AMQPMessage $msg) {
      try {
        if (!$this->circuitBreaker->isAvailable()) {
          echo "[Circuit Breaker] Service unavailable\n";
          $msg->nack(true);
          return;
        }

        $this->telegramSender->send($msg->body);
        $msg->ack();
        $this->circuitBreaker->reset();

      } catch (\Exception $e) {
        $this->circuitBreaker->recordFailure();
        $msg->nack(true);
        echo "[Error] {$e->getMessage()}\n";
      }
    };

    $this->channel->basic_consume(
      $this->config['queue'],
      '',
      false,
      false,
      false,
      false,
      $callback
    );

    while ($this->channel->is_consuming()) {
      $this->channel->wait();
    }
  }

  public function __destruct() {
    $this->channel->close();
    $this->connection->close();
  }
}

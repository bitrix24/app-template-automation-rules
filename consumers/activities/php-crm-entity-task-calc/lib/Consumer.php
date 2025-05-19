<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Exception\AMQPTimeoutException;

class Consumer
  extends BaseRabbitMQ
{
  private int $retries = 0;
  private array $handlers = [];

  public function initialize(): void
  {
    $this->connect();
    $this->setupExchanges();
    $this->setupQueues();
  }

  public function connect(): void
  {
    try {
      $this->logger->info('[RabbitMQ::Consumer] connect...');
      $this->connection = new AMQPStreamConnection(
        $this->config->connection['url']['host'],
        $this->config->connection['url']['port'],
        $this->config->connection['url']['user'],
        $this->config->connection['url']['pass']
      );
      $this->channel = $this->connection->channel();
      $this->channel->basic_qos(
        0,
        $this->config->channel['prefetch_count'],
        false
      );
      $this->retries = 0;
      $this->logger->info('[RabbitMQ::Consumer] connected successfully');
    } catch (\Exception $e) {
      $this->logger->error('[RabbitMQ::Consumer] connection error: ' . $e->getMessage());
      $this->handleReconnect();
    }
  }

  private function handleReconnect(): void
  {
    $maxRetries = $this->config->connection['maxRetries'] ?? 5;
    if ($this->retries >= $maxRetries) {
      throw new Exceptions\RabbitMQException('[RabbitMQ::Consumer] Max connection retries exceeded');
    }

    $this->retries++;
    $interval = $this->config->connection['reconnectInterval'] ?? 5000;
    $this->logger->info('[RabbitMQ::Consumer] reconnecting attempt ' . $this->retries);
    sleep($interval / 1000);
    $this->connect();
  }

  public function registerHandler(
    string                $queueName,
    Types\IMessageHandler $handler
  ): void
  {
    $this->handlers[$queueName] = $handler;
  }

  public function unRegisterHandler(string $queueName): void
  {
    unset($this->handlers[$queueName]);
  }

  /**
   * Channel status check
   * @return bool
   */
  public function isConsuming(): bool
  {
    return $this->channel->is_consuming();
  }

  /**
   * Starts processing messages with limited attempts
   *
   * @param string $queueName Queue name
   * @param int $maxAttempts Maximum number of processing attempts (processed messages if prefetch_count = 1) (0 - unlimited)
   * @param int $timeoutMs Timeout in milliseconds (0 - unlimited)
   */
  public function consume(
    string $queueName,
    int    $maxAttempts = 0,
    int    $timeoutMs = 0
  ): void
  {
    $attempts = 0;
    $startTime = microtime(true);

    $this->channel->basic_consume(
      $queueName,
      '',
      false,
      false,
      false,
      false,
      function (AMQPMessage $msg) use ($queueName) {
        if (isset($this->handlers[$queueName])) {
          try {
            $body = json_decode($msg->getBody(), true);
            $this->handlers[$queueName]->handle(
              $body,
              function () use ($msg) {
                $msg->ack();
              },
              function () use ($msg) {
                $msg->nack(false);
              }
            );
          } catch (\Exception $e) {
            $this->logger->error('[RabbitMQ] Error processing message: ' . $e->getMessage());
            $msg->nack(false);
          }
        }
      }
    );

    // Main processing cycle
    while ($this->isConsuming()) {
      // Checking restrictions
      if (
        $this->shouldStopConsuming(
          $maxAttempts,
          $timeoutMs,
          $attempts,
          $startTime
        )
      ) {
        break;
      }

      // Waiting for message with timeout
      try {
        $this->channel->wait(
          null,
          false,
          $this->calculateRemainingTimeout($timeoutMs, $startTime)
        );
      } catch (AMQPTimeoutException $exception) {
        // Timeout - normal termination
        break;
      }

      $attempts++;
    }
  }

  private function shouldStopConsuming(
    int   $maxAttempts,
    int   $timeoutMs,
    int   $currentAttempts,
    float $startTime
  ): bool
  {
    // Attempt limit
    if (
      $maxAttempts > 0
      && $currentAttempts >= $maxAttempts
    ) {
      return true;
    }

    // Time limit
    if (
      $timeoutMs > 0
      && $this->getElapsedTimeMs($startTime) >= $timeoutMs
    ) {
      return true;
    }

    return false;
  }

  private function getElapsedTimeMs(float $startTime): float
  {
    return (microtime(true) - $startTime) * 1000;
  }

  private function calculateRemainingTimeout(
    int   $timeoutMs,
    float $startTime
  ): null|float
  {
    // No timeout
    if ($timeoutMs === 0) {
      return null;
    }

    $remaining = ($timeoutMs - $this->getElapsedTimeMs($startTime)) / 1000;
    return max($remaining, 0);
  }
}

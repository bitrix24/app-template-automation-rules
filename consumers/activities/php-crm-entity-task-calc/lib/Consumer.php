<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ;

use Exception;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Exception\AMQPTimeoutException;
use Bitrix24\RabbitMQ\Exceptions\RabbitMQException;
use Bitrix24\RabbitMQ\Exceptions\MemoryException;

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
    Utils\Memory\Manager::getInstance()->start();
  }

  /**
   * @return void
   * @throws Exceptions\RabbitMQException
   */
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
    } catch (Exception $exception) {
      $this->logger->error('[RabbitMQ::Consumer] connection error: ' . $exception->getMessage());
      $this->handleReconnect();
    }
  }

  /**
   * @throws RabbitMQException
   */
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

        $gcInterval = 1_000;
        $sleepSeconds = 0;
        $sleepNanoseconds = 10_000_000;

        if (isset($this->handlers[$queueName])) {
          /** @var Types\IMessageHandler $handler */
          $handler = $this->handlers[$queueName];
          try {
            $body = json_decode($msg->getBody(), true);

            $gcInterval = $handler->getGcInterval();
            $sleepSeconds = $handler->getSleepSeconds();
            $sleepNanoseconds = $handler->getSleepNanoseconds();

            $handler->handle(
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

        Utils\Memory\Manager::getInstance()->performGarbageCollection(
          $gcInterval,
          $sleepSeconds,
          $sleepNanoseconds
        );
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
        Utils\Memory\Manager::getInstance()->stop();

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
        Utils\Memory\Manager::getInstance()->stop();
        $this->logger->info('[RabbitMQ] Timeout - normal termination');
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
      $this->logger->info('[RabbitMQ] Attempts - normal termination', [
        'currentAttempts' => $currentAttempts,
        'maxAttempts' => $maxAttempts,
      ]);
      return true;
    }

    // Time limit
    if (
      $timeoutMs > 0
      && $this->getElapsedTimeMs($startTime) >= $timeoutMs
    ) {
      $this->logger->info('[RabbitMQ] Timeout - normal termination', []);
      return true;
    }

    // Memory limit
    if ($this->isMemoryLimitApproaching()) {
      $this->logger->info('[RabbitMQ] Memory - normal termination', [
        'limit' => ($this->getMemoryLimit()).' MB',
        'reserv' => ($this->getMemoryReserv()).' MB',
        'used' => Utils\Memory\Manager::getInstance()->getPeakMemoryUsage(),
      ]);
      return true;
    }

    return false;
  }

  /**
   * Returns the set memory limit
   *
   * @return int
   */
  public function getMemoryLimit(): int
  {
    return $this->config->connection['memoryLimit'] ?? 5;
  }

  public function getMemoryReserv(): int
  {
    return $this->config->connection['memoryReserv'] ?? 2;
  }

  /**
   * Checks that the memory is greater than that allowed to this process.
   *
   * @return boolean
   */
  protected function isMemoryLimitApproaching(): bool
  {
    try {
      return Utils\Memory\Manager::getInstance()->isMemoryLimitApproaching(
        ($this->getMemoryLimit()).'M',
        ($this->getMemoryReserv()).'M'
      );
    } catch (MemoryException $exception) {
      return false;
    }
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

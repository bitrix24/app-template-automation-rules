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

    public function initialize(): void {
        $this->connect();
        $this->setupExchanges();
        $this->setupQueues();
    }

    public function connect(): void {
        try {
            echo '[RabbitMQ::Consumer] connect...'.PHP_EOL;
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
            echo '[RabbitMQ::Consumer] connected successfully'.PHP_EOL;
        } catch (\Exception $e) {
            echo '[RabbitMQ::Consumer] connection error: '.$e->getMessage().PHP_EOL;
            $this->handleReconnect();
        }
    }

    private function handleReconnect(): void {
        $maxRetries = $this->config->connection['maxRetries'] ?? 5;
        if ($this->retries >= $maxRetries) {
            throw new Exceptions\RabbitMQException('[RabbitMQ::Consumer] Max connection retries exceeded');
        }

        $this->retries++;
        $interval = $this->config->connection['reconnectInterval'] ?? 5000;
        echo '[RabbitMQ::Consumer] reconnecting attempt '.$this->retries.PHP_EOL;
        sleep($interval / 1000);
        $this->connect();
    }

    public function registerHandler(
      string $queueName,
      Types\IMessageHandler $handler
    ): void {
        $this->handlers[$queueName] = $handler;
    }

    public function unRegisterHandler(string $queueName): void {
        unset($this->handlers[$queueName]);
    }

    // проверка состояния канала ///
    public function isConsuming(): bool
    {
        return $this->channel->is_consuming();
    }
    
    /**
     * Запускает обработку сообщений с ограничением попыток
     * 
     * @param string $queueName Название очереди
     * @param int $maxAttempts Максимальное количество попыток обработки ( обработанных сообщений если prefetch_count = 1 ) (0 - без ограничений)
     * @param int $timeoutMs Таймаут в миллисекундах (0 - без ограничений)
     */
    public function consume(
      string $queueName,
      int $maxAttempts = 0,
      int $timeoutMs = 0
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
                            function () use ($msg) { $msg->ack(); },
                            function () use ($msg) { $msg->nack(false); }
                        );
                    } catch (\Exception $e) {
                        echo '[RabbitMQ] Error processing message: '.$e->getMessage().PHP_EOL;
                        $msg->nack(false);
                    }
                }
            }
        );
        
        // Основной цикл обработки
        while ($this->isConsuming()) {
            // Проверка ограничений
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

            // Ожидание сообщения с таймаутом
            try {
                $this->channel->wait(
                  null,
                  false,
                  $this->calculateRemainingTimeout($timeoutMs, $startTime)
                );
            } catch (AMQPTimeoutException $e) {
                // Таймаут - нормальное завершение
                break;
            }
            
            $attempts++;
        }
    }

    private function shouldStopConsuming(
        int $maxAttempts,
        int $timeoutMs,
        int $currentAttempts,
        float $startTime
    ): bool {
        // Лимит попыток
        if (
          $maxAttempts > 0
          && $currentAttempts >= $maxAttempts
        ) {
            return true;
        }

        // Лимит времени
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
      int $timeoutMs,
      float $startTime
    ): null | float
    {
        // Без таймаута
        if ($timeoutMs === 0) {
            return null;
        }

        $remaining = ($timeoutMs - $this->getElapsedTimeMs($startTime)) / 1000;
        return max($remaining, 0);
    }
}
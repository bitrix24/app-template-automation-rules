<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Channel\AMQPChannel;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

/**
 * Base class for RabbitMQ operations.
 */
abstract class BaseRabbitMQ
{
  protected LoggerInterface $logger;
  protected AMQPStreamConnection $connection;
  protected AMQPChannel $channel;
  protected Types\RabbitMQConfig $config;

  public function __construct(
    Types\RabbitMQConfig $config,
    ?LoggerInterface     $logger = null
  )
  {
    $this->config = new Types\RabbitMQConfig(
      $config->connection,
      $config->exchanges,
      $config->queues,
      array_merge(['prefetch_count' => 1], $config->channel)
    );

    if ($logger === null) {
      $logger = new NullLogger();
    }

    $this->logger = $logger;
  }

  abstract public function connect(): void;

  protected function setupExchanges(): void
  {
    foreach ($this->config->exchanges as $exchange) {
      $this->registerExchange($exchange);
    }
  }

  public function registerExchange(Types\ExchangeParams $exchange): void
  {
    $options = $exchange->options;
    unset($options['durable']);

    $this->channel->exchange_declare(
      $exchange->name,
      $exchange->type,
      false,
      $exchange->options['durable'] ?? false,
      false,
      false,
      false,
      new AMQPTable($options)
    );
  }

  protected function setupQueues(): void
  {
    foreach ($this->config->queues as $queue) {
      $this->registerQueue($queue);
    }
  }

  public function registerQueue(Types\QueueParams $queue): array
  {
    $arguments = [];
    if ($queue->maxPriority > 0) {
      $arguments['x-max-priority'] = $queue->maxPriority;
    }

    if ($queue->deadLetter) {
      $arguments['x-dead-letter-exchange'] = $queue->deadLetter['exchange'];
      $arguments['x-dead-letter-routing-key'] = $queue->deadLetter['routingKey'] ?? '';
    }

    $result = $this->channel->queue_declare(
      $queue->name ?? '',
      false,
      $queue->options['durable'] ?? false,
      false,
      false,
      false,
      new AMQPTable(array_merge($arguments, $queue->options['arguments'] ?? []))
    );

    foreach ($queue->bindings as $binding) {
      $this->channel->queue_bind(
        $result[0],
        $binding['exchange'],
        $binding['routingKey'] ?? '',
        false,
        new AMQPTable($binding['headers'] ?? [])
      );
    }

    return $result;
  }

  public function disconnect(): void
  {
    $this->channel->close();
    $this->connection->close();
    $this->logger->info('[RabbitMQ::Base] disconnect');
  }
}

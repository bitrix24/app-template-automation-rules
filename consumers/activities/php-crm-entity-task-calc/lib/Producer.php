<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ;

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;

class Producer
  extends BaseRabbitMQ
{
  private array $exchanges = [];

  public function initialize(): void
  {
    $this->connect();
    $this->setupExchanges();
  }

  public function connect(): void
  {
    try {
      $this->logger->info('[RabbitMQ::Producer] connect...');
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
      $this->logger->info('[RabbitMQ::Producer] connected successfully');
    } catch (\Exception $e) {
      $this->logger->error('[RabbitMQ::Producer] connection error: ' . $e->getMessage());
      throw $e;
    }
  }

  public function publish(
    string                    $exchangeName,
    string                    $routingKey,
    mixed                     $message,
    null|Types\MessageOptions $options = null
  ): void
  {
    $options = $options ?? new Types\MessageOptions();
    $properties = [
      'content_type' => 'application/json',
      'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
      'priority' => $options->priority,
      'headers' => new AMQPTable($options->headers)
    ];

    $msg = new AMQPMessage(
      json_encode($message),
      array_merge($properties, $options->properties)
    );

    $this->channel->basic_publish(
      $msg,
      $exchangeName,
      $routingKey
    );
  }
}

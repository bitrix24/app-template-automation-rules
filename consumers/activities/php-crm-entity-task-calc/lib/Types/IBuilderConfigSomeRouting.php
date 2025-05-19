<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfigSomeRouting
{
  public function getExchange(): string;

  public function getQueueName(): string;

  public function getRoutingKey(): string;
}

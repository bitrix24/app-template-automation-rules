<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfigSomeDelayed
  extends IBuilderConfigSomeService
{
  public function getDelayedQueueName(): string;

  public function getDelayRoutingKey(): string;

  public function getDelayMs(): int;

  public function getFailedQueueName(): string;

  public function getFailedRoutingKey(): string;
}

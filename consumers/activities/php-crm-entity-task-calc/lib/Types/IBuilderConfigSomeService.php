<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfigSomeService
{
  public function getServiceExchange(): string;

  public function getServiceRoutingKey(): string;
}

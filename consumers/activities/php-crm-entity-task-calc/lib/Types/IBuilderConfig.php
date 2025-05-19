<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfig
{
  public function buildExchanges(): array;

  public function buildQueues(): array;
}

<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

class ExchangeParams
{
  public function __construct(
    public string $name,
    public string $type, // 'direct', 'fanout', 'topic', 'headers'
    public array  $options = []
  )
  {
  }
}

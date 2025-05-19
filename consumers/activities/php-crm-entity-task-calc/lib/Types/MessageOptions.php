<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

class MessageOptions
{
  public function __construct(
    public int   $priority = 5,
    public array $headers = [],
    public array $properties = []
  )
  {
  }
}

<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

class RabbitMQConfig {
    public function __construct(
        public array $connection,
        public array $exchanges,
        public array $queues,
        public array $channel = ['prefetch_count' => 1]
    ) {}
}

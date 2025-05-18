<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

class QueueParams {
    public function __construct(
        public ?string $name = null,
        public array $options = [],
        public int $maxPriority = 10,
        public array $bindings = [],
        public ?array $deadLetter = null
    ) {}
}
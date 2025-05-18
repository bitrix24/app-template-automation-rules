<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IMessageHandler {
    public function handle($msg, callable $ack, callable $nack): void;
}
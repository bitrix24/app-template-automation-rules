<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use Consumer\CircuitBreaker;
use Consumer\RabbitMQConsumer;
use Consumer\TelegramSender;
use Consumer\HealthChecker;

$config = include __DIR__ . '/config.php';

// Инициализация зависимостей
$telegramSender = new TelegramSender(
  $config['telegram']['bot_token'],
  $config['telegram']['chat_id']
);

$circuitBreaker = new CircuitBreaker(
  $config['circuit_breaker']['max_failures'],
  $config['circuit_breaker']['reset_timeout']
);

// Health Checker
$healthChecker = new HealthChecker(
  $config['rabbitmq'],
  $config['telegram']['bot_token']
);

if (!$healthChecker->check()) {
  throw new \RuntimeException('Health check failed');
}

// Запуск консьюмера
$consumer = new RabbitMQConsumer(
  $config['rabbitmq'],
  $telegramSender,
  $circuitBreaker
);

$consumer->consume();

<?php

declare(strict_types=1);

return [
  'rabbitmq' => [
    'host' => getenv('RABBITMQ_HOST'),
    'port' => (int)getenv('RABBITMQ_PORT') ?: 5672,
    'user' => getenv('RABBITMQ_USER'),
    'pass' => getenv('RABBITMQ_PASS'),
    'queue' => 'telegram_queue',
  ],
  'telegram' => [
    'bot_token' => getenv('TELEGRAM_BOT_TOKEN'),
    'chat_id' => getenv('TELEGRAM_CHAT_ID'),
    'api_url' => 'https://api.telegram.org/bot%s/sendMessage',
  ],
  'circuit_breaker' => [
    'max_failures' => 3,
    'reset_timeout' => 300,
  ],
];

<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

/**
 * connection = [
 *  url => [
 *    host: null|string
 *    port: int
 *    user: null|string
 *    pass: null|string
 *  ],
 *  reconnectInterval: int = 5000
 *  maxRetries: int = 5
 *  memoryLimit: int = 5 -> 5Mb
 *  memoryReserv: int = 2 -> 5Mb
 */
class RabbitMQConfig
{
  public function __construct(
    public array $connection,
    public array $exchanges,
    public array $queues,
    public array $channel = ['prefetch_count' => 1]
  )
  {
  }

  public static function getConnectionFromUrl(string $url): array
  {
    $tmp = parse_url($url);
    return [
      'host' => $tmp['host'] ?? null,
      'port' => $tmp['port'] ?? 0,
      'user' => $tmp['user'] ?? null,
      'pass' => $tmp['pass'] ?? null,
    ];
  }
}

<?php
declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Utils\Memory;

use DateTimeImmutable;
use DateTimeInterface;
use JsonSerializable;

/**
 * Class for storing memory consumption data
 * at a specific point in time
 */
final class Statistic
  implements JsonSerializable
{
  private const string dateFormat = 'Y-m-d H:i:s';
  private const string printFormat = '[%s] Memory: %-8s | Info: %s';

  public function __construct(
    public readonly string            $memoryUsage,
    public readonly string            $info,
    public readonly DateTimeImmutable $timestamp = new DateTimeImmutable(),
  )
  {
    $this->validate();
  }

  /**
   * Input data validation
   * @throws \InvalidArgumentException
   */
  private function validate(): void
  {
    if (empty($this->info)) {
      throw new \InvalidArgumentException('Info cannot be empty');
    }

    if (!preg_match('/^\d+\.?\d* (B|KB|MB|GB|TB)$/', $this->memoryUsage)) {
      throw new \InvalidArgumentException('Invalid memory format');
    }
  }

  /**
   * Formatted output for logs
   */
  public function toString(): string
  {
    return sprintf(
      self::printFormat,
      $this->timestamp->format(self::dateFormat),
      $this->memoryUsage,
      $this->info
    );
  }

  /**
   * For compatibility with JSON serialization
   */
  public function jsonSerialize(): array
  {
    return [
      'timestamp' => $this->timestamp->format(DateTimeInterface::ATOM),
      'memory' => $this->memoryUsage,
      'info' => $this->info
    ];
  }

  /**
   * Alternative time representation
   */
  public function getUnixTime(): int
  {
    return $this->timestamp->getTimestamp();
  }

  /**
   * Formatting time using a custom template
   */
  public function formatTime(string $format = self::dateFormat): string
  {
    return $this->timestamp->format($format);
  }
}

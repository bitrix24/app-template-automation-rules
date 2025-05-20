<?php
declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Utils\Memory;

use Bitrix24\RabbitMQ\Exceptions\MemoryException;
use Psr\Log\LoggerInterface;

/**
 * Class for monitoring memory usage
 * with the ability to record statistics
 * and automatically clean up memory
 */
class Manager
{
  private static ?self $instance = null;
  private bool $realUsage;
  private array $statistics;
  private const array memoryUnits = [
    'B' => 1,
    'KB' => 1024,
    'MB' => 1024 ** 2,
    'GB' => 1024 ** 3,
    'TB' => 1024 ** 4,
    'PB' => 1024 ** 5,
  ];

  public static function getInstance(): self
  {
    if (self::$instance === null) {
      self::$instance = new self();
    }

    return self::$instance;
  }

  protected function __construct()
  {
    $this->realUsage = false;
    $this->statistics = [];
  }

  public function getCurrentMemoryUsage(bool $withStyle = true): string
  {
    $mem = memory_get_usage($this->realUsage);
    return $withStyle
      ? $this->formatBytes($mem)
      : (string)$mem;
  }

  public function getPeakMemoryUsage(bool $withStyle = true): string
  {
    $mem = memory_get_peak_usage($this->realUsage);
    return $withStyle
      ? $this->formatBytes($mem)
      : (string)$mem;
  }

  public function recordMemoryPoint(string $info = ''): void
  {
    array_unshift(
      $this->statistics,
      new Statistic(
        $this->getCurrentMemoryUsage(),
        $info
      )
    );
  }

  public function start(string $info = '>> Start'): void
  {
    $this->recordMemoryPoint($info);
  }

  public function stop(string $info = '>> End'): void
  {
    $this->recordMemoryPoint($info);
  }

  public function printStatistics(string $delimiter = PHP_EOL): string
  {
    $result = '';
    foreach ($this->statistics as $statistic) {
      $result .= $statistic->getPrint() . $delimiter;
    }

    $result .= str_repeat($delimiter, 2)
      . 'Peak memory usage: ' . $this->getPeakMemoryUsage()
      . str_repeat($delimiter, 2);

    return $result;
  }

  public function getStatistics(): \stdClass
  {
    return (object)[
      'peak' => $this->getPeakMemoryUsage(),
      'points' => $this->statistics,
    ];
  }

  /**
   * Converts human-readable units of measurement to bytes
   */
  public function convertToBytes(int|string $humanUnit): int
  {
    $numerical = $humanUnit;
    if(!is_numeric($humanUnit))
    {
      $numerical = (int)substr($humanUnit, 0, -1);
      switch(substr($humanUnit, -1))
      {
        case 'G':
          $numerical *= pow(1024, 3);
          break;
        case 'M':
          $numerical *= pow(1024, 2);
          break;
        case 'K':
          $numerical *= 1024;
          break;
      }
    }

    return (int)$numerical;
  }

  /**
   * Formats bytes into a human-readable format.
   */
  private function formatBytes(
    int    $bytes,
    string $forceUnit = '',
    int    $precision = 2
  ): string
  {
    if ($bytes === 0) {
      return '0 B';
    }

    $units = array_keys(self::memoryUnits);
    $maxUnit = count($units) - 1;

    if ($forceUnit === '' || !in_array($forceUnit, $units)) {
      $pow = floor(log($bytes) / log(1024));
      $pow = min($pow, $maxUnit);
      $unit = $units[$pow];
    } else {
      $unit = $forceUnit;
    }

    $value = $bytes / self::memoryUnits[$unit];
    return round($value, $precision) . ' ' . $unit;
  }

  /**
   * Checks for approaching memory limit
   * @return bool `true` - if we are approaching, `false` - if we are not approaching
   * @throws MemoryException - if the limit is less than the reserve
   */
  public function isMemoryLimitApproaching(
    string $memoryLimit,
    string $reserve = '2M'
  ): bool
  {
    $limitBytes = $this->convertToBytes($memoryLimit);
    $reserveBytes = $this->convertToBytes($reserve);

    if ($reserveBytes > $limitBytes) {
      throw new MemoryException(
        'Memory reserve cannot exceed total limit'
      );
    }

    $currentUsage = (int)$this->getCurrentMemoryUsage(false);
    $threshold = $limitBytes - $reserveBytes;

    if ($currentUsage > $threshold) {
      return true;
    }

    return false;
  }

  /**
   * Periodically clear memory at a specified interval
   */
  public static function performGarbageCollection(
    int $gcInterval = 1_000,
    int $sleepSeconds = 0,
    int $sleepNanoseconds = 10_000_000
  ): void
  {
    static $iterationCounter;
    if(null === $iterationCounter)
    {
      $iterationCounter = 0;
    }

    $iterationCounter++;

    if ($iterationCounter % $gcInterval !== 0) {
      return;
    }

    if (gc_enabled()) {
      gc_mem_caches();
      gc_collect_cycles();
    }

    if ($sleepSeconds > 0 || $sleepNanoseconds > 0) {
      time_nanosleep($sleepSeconds, $sleepNanoseconds);
    }

    $iterationCounter = 0;
  }

  private function __clone()
  {
  }

  /**
   * @throws \LogicException
   */
  public function __wakeup()
  {
    throw new \LogicException('Cannot unserialize singleton');
  }
}

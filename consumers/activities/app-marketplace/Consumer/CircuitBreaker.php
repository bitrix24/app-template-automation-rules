<?php

declare(strict_types=1);

namespace Consumer\;

class CircuitBreaker {
  private int $failureCount = 0;
  private ?int $lastFailureTime = null;

  public function __construct(
    private int $maxFailures,
    private int $resetTimeout
  ) {}

  public function isAvailable(): bool {
    if ($this->failureCount >= $this->maxFailures) {
      return time() - $this->lastFailureTime > $this->resetTimeout;
    }
    return true;
  }

  public function recordFailure(): void {
    $this->failureCount++;
    $this->lastFailureTime = time();
  }

  public function reset(): void {
    $this->failureCount = 0;
    $this->lastFailureTime = null;
  }
}

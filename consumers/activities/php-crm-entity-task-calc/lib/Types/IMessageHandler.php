<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IMessageHandler
{
  /**
   * Specifies after how many processed messages the memory should be cleared and a pause should be performed.
   * @return int
   * @default 1_000
   */
  public function getGcInterval(): int;

  /**
   * Specifies a pause in seconds
   * @return int
   * @default 0
   */
  public function getSleepSeconds(): int;

  /**
   * Specifies a pause in nanoseconds
   * @return int
   * @default 10_000_000
   */
  public function getSleepNanoseconds(): int;

  /**
   * Обработчик сообщений
   *
   * @param $msg
   * @param callable $ack
   * @param callable $nack
   * @return void
   */
  public function handle($msg, callable $ack, callable $nack): void;
}

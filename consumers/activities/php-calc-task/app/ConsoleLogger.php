<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Monolog\Logger;
use Monolog\Level;
use Monolog\Handler\StreamHandler;
use Monolog\Formatter\LineFormatter;

class ConsoleLogger
{
  public static function create(): Logger
  {
    $logger = new Logger('php-crm-entity-task-calc');

    $stream = new StreamHandler(
      'php://stdout',
      Config::getInstance()->isDev
        ? Level::Debug
        : Level::Info,
    );

    $formatter = new LineFormatter(
      "%datetime% > %channel% > %level_name% > %message%\n",
      "Y-m-d H:i:s"
    );

    $stream->setFormatter($formatter);
    $logger->pushHandler($stream);

    return $logger;
  }
}

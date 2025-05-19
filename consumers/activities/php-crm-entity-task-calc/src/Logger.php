<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Monolog\Formatter\LineFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger as MonologLogger;
use Monolog\Utils;
use Psr\Log\LoggerInterface;

class Logger
{
  public static function create(): LoggerInterface
  {
    $logger = new MonologLogger('php-crm-entity-task-calc');

    $stream = new StreamHandler(
      'php://stdout',
      Config::getInstance()->isDev
        ? Level::Debug
        : Level::Info,
      true,
      null,
      true
    );

    $formatter = new LineFormatter(
      "%datetime% > %channel% > %level_name% > %message% %context%\n",
      "Y-m-d H:i:s"
    );

    $stream->setFormatter($formatter);
    $logger->pushHandler($stream);

    return $logger;
  }
}

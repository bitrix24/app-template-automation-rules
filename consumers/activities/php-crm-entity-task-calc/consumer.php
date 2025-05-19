<?php
/**
 * php consumer.php
 */
declare(strict_types=1);

use Bitrix24\RabbitMQ\Consumer;
use AppCrmEntityTaskCalc\Logger;
use AppCrmEntityTaskCalc\Processor;

require __DIR__ . '/vendor/autoload.php';

$logger = Logger::create();
$processor = new Processor($logger);

$logger->info(sprintf(
  'Consumer for %s started ...',
  $processor->getConfigRabbitMQ()->getParams()->getQueueName()
));

$consumer = new Consumer(
  $processor->getConfigRabbitMQ()->rabbitmqConfig,
  $logger
);
$consumer->initialize();

$consumer->registerHandler(
  $processor->getConfigRabbitMQ()->getParams()->getQueueName(),
  $processor
);

$consumer->consume(
  $processor->getConfigRabbitMQ()->getParams()->getQueueName()
);

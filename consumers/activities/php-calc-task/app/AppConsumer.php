<?php
/**
 * php app/AppConsumer.php
 */
declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Bitrix24\RabbitMQ\Consumer;
use Bitrix24\SDK\Services\ServiceBuilderFactory;

require __DIR__ . '/../vendor/autoload.php';

$config = Config::getInstance();
$logger = ConsoleLogger::create();
$processor = new MessageProcess($logger);

$logger->info('Consumer for '.$processor::activityCode.' started ...');

$B24 = ServiceBuilderFactory::createServiceBuilderFromWebhook(
  $_ENV['HOOK_URL']
);
$entityTypeId = 2;
$entityId = 1188;

$processor->process(
  $B24,
  $entityTypeId,
  $entityId
);
//
//$consumer = new Consumer($config->rabbitmqConfig);
//$consumer->registerHandler(
//  $processor::getQueueName(),
//  new MessageProcess()
//);
//
//$consumer->consume($processor::getQueueName());

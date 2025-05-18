<?php

declare(strict_types=1);

use Bitrix24\SDK\Services\ServiceBuilderFactory;
use Dotenv\Dotenv;

require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv::createImmutable(__DIR__.'/..');
$dotenv->load();

$entityTypeId = 2;
$entityId = 1188;

fwrite(STDOUT, '---------'.PHP_EOL);
fwrite(STDOUT, sprintf('HOOK_URL: %s'.PHP_EOL, $_ENV['HOOK_URL']));
fwrite(STDOUT, '---------'.PHP_EOL);
fwrite(STDOUT, sprintf('$entityTypeId: %s'.PHP_EOL, $entityTypeId));
fwrite(STDOUT, sprintf('$entityId: %s'.PHP_EOL, $entityId));
fwrite(STDOUT, '---------'.PHP_EOL);


$B24 = ServiceBuilderFactory::createServiceBuilderFromWebhook(
  $_ENV['HOOK_URL']
);

$lastId = 0;
$finish = false;
$iterator = 0;
$list = [];
$limitCall = 40;
$minSleepSec = 2;
$sleepSec = 3;
while (!$finish)
{
  fwrite(STDOUT, sprintf('$iterator: %s | $lastId: %s | ttl: %s'.PHP_EOL, $iterator, $lastId, count($list)));
  $filter = [
    '>ID' => $lastId,
    //'UF_CRM_TASK' => join('_', ['D', $entityId])
  ];
  try {
    if ($iterator >= $limitCall) {
      throw new \Bitrix24\SDK\Core\Exceptions\MethodConfirmWaitingException(
        'tasks.task.list',
        'need sleep'
      );
    }
    $data = $B24->core
      ->call(
        'tasks.task.list',
        [
          'start' => -1,
          'order' => ['ID' => 'asc'],
          'filter' => $filter,
          'select' => [
            'ID',
            'TIME_SPENT_IN_LOGS'
          ]
        ]
      )
      ->getResponseData()->getResult()['tasks'];
  } catch(\Bitrix24\SDK\Core\Exceptions\MethodConfirmWaitingException|\Bitrix24\SDK\Core\Exceptions\QueryLimitExceededException $exception) {
    if ($exception instanceof \Bitrix24\SDK\Core\Exceptions\QueryLimitExceededException)
    {
      $sleepSec++;
      $limitCall = max($limitCall - 5, 2);
    } else {
      $sleepSec = max($sleepSec - 1, $minSleepSec);
    }
    fwrite(STDOUT, '---------'.PHP_EOL);
    fwrite(STDOUT, sprintf('catch: $exception %s'.PHP_EOL, get_class($exception)));
    fwrite(STDOUT, sprintf('sleep: %s sec'.PHP_EOL, $sleepSec));
    sleep($sleepSec);
    $iterator = 0;

    fwrite(STDOUT, sprintf('wakeUp. Limit: %s'.PHP_EOL, $limitCall));
    fwrite(STDOUT, '---------'.PHP_EOL);
  }


  if (empty($data)) {
    $finish = true;
    break;
  }

  foreach ($data as $row) {
    $lastId = (int)$row['id'];
    $list[] = [
      'id' => $lastId,
      'timeSpentInLogs' => (int)$row['timeSpentInLogs']
    ];
  }

  $iterator++;
}

fwrite(STDOUT, '---------'.PHP_EOL);
fwrite(STDOUT, sprintf('TTL ROWS: %s'.PHP_EOL, count($list)));
fwrite(STDOUT, '---------'.PHP_EOL);
// print_r($list);

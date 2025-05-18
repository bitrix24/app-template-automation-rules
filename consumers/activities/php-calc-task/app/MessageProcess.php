<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Bitrix24\SDK\Services\ServiceBuilderFactory;
use Bitrix24\SDK\Services\ServiceBuilder;
use Bitrix24\RabbitMQ\Types\IMessageHandler;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

class MessageProcess
  implements IMessageHandler
{
  private LoggerInterface $logger;
  public const string activityCode = 'CrmEntityTaskCalc';
  public const string ver = 'v1';
  private const int maxRetryCount = 5;

  public static function getQueueName(): string {
    return sprintf(
      'activity.%s.%s',
      static::activityCode,
      static::ver
    );
  }

  public function __construct(?LoggerInterface $logger = null) {
    if ($logger === null) {
      $logger = new NullLogger();
    }

    $this->logger = $logger;
  }

  public function handle(
    $msg,
    callable $ack,
    callable $nack
  ): void {
    $this->logger->debug('Received: '.print_r($msg, true));

    $B24 = ServiceBuilderFactory::createServiceBuilderFromWebhook(
      $_ENV['HOOK_URL']
    );
    $entityTypeId = 2;
    $entityId = 1188;

    $this->process(
      $B24,
      $entityTypeId,
      $entityId
    );

    $ack();
  }

  public function process(
    ServiceBuilder $B24,
    int $entityTypeId,
    int $entityId
  ): void
  {
    /**
     * @todo fix d by $entityTypeId
     */
    $ufCrmTask = join('_', ['D', $entityId]);
    $taskList = $this->getAllTasksForEntity($B24, $ufCrmTask);
    $this->logger->debug(sprintf('TTL ROWS: %s', count($taskList)));
  }

  private function getAllTasksForEntity(
    ServiceBuilder $B24,
    string $ufCrmTask
  ): array
  {
    $result = [];

    $lastId = 0;
    $finish = false;
    $iterator = 0;

    $limitCall = 40;
    $minSleepSec = 2;
    $sleepSec = 3;

    while (!$finish)
    {
      $this->logger->debug(sprintf(
        '$iterator: %s | $lastId: %s | count: %s',
        $iterator,
        $lastId,
        count($result)
      ));
      $filter = [
        '>ID' => $lastId,
        /**
         * @todo on this
         */
        // 'UF_CRM_TASK' => $ufCrmTask
      ];

      try {
        if ($iterator >= $limitCall) {
          throw new Exceptions\NeedSleepException('Need sleep');
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
      } catch(\Bitrix24\SDK\Core\Exceptions\QueryLimitExceededException $exception) {
        $this->logger->debug('>> QueryLimitExceededException >>>');
        $sleepSec++;
        $limitCall = max($limitCall - 5, 2);
        $this->logger->debug(sprintf('sleep: %s sec', $sleepSec));
        sleep($sleepSec);
        $this->logger->debug(sprintf('wakeUp. Limit: %s', $limitCall));
        $iterator = 0;
      } catch(Exceptions\NeedSleepException $exception) {
        $this->logger->debug('>> NeedSleepException >>>');
        $sleepSec = max($sleepSec - 1, $minSleepSec);
        $this->logger->debug(sprintf('sleep: %s sec', $sleepSec));
        sleep($sleepSec);
        $this->logger->debug(sprintf('wakeUp. Limit: %s', $limitCall));
        $iterator = 0;
      }

      if (empty($data)) {
        $finish = true;
        break;
      }

      foreach ($data as $row) {
        $lastId = (int)$row['id'];
        $result[] = [
          'id' => $lastId,
          'timeSpentInLogs' => (int)$row['timeSpentInLogs']
        ];
      }

      $iterator++;
    }

    return $result;
  }
}

<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Bitrix24\RabbitMQ\Producer;
use Bitrix24\RabbitMQ\Types\IMessageHandler;
use Bitrix24\RabbitMQ\Utils\Memory;
use Bitrix24\SDK\Core\Exceptions\BaseException;
use Bitrix24\SDK\Core\Exceptions\InvalidArgumentException;
use Bitrix24\SDK\Core\Exceptions\TransportException;
use Bitrix24\SDK\Core\Exceptions\UnknownScopeCodeException;
use Bitrix24\SDK\Services\ServiceBuilder;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

class Processor
  implements IMessageHandler
{
  private LoggerInterface $logger;
  public const string activityCode = 'CrmEntityTaskCalc';
  public const string ver = 'v1';
  private const int maxRetryCount = 5;

  public function getConfigRabbitMQ(): ConfigRabbitMQ {
    return ConfigRabbitMQ::getInstance(
      static::activityCode,
      static::ver
    );
  }

  // region RabbitMq ////
  public function __construct(?LoggerInterface $logger = null) {
    if (null === $logger) {
      $logger = new NullLogger();
    }
    $this->logger = $logger;
  }

  public function handle(
    $msg,
    callable $ack,
    callable $nack
  ): void {
    try {
      $retryCount = (int)($msg['retryCount'] ?? 0);
      if ($retryCount >= static::maxRetryCount) {
        throw new \Exception('Max retries exceeded');
      }
      $this->logger->info(
        sprintf(
          '[RabbitMQ::%s] mem: %s >> %s | %s',
          static::activityCode,
          Memory\Manager::getInstance()->getPeakMemoryUsage(),
          (string)$msg['routingKey'],
          $retryCount
        ),
        [
          'routingKey' => (string)$msg['routingKey'],
          'retryCount' => $retryCount,
          'msg' => $msg
        ]
      );

      // $this->logger->debug(json_encode($msg, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));


      /**
       * @memo use for test
       */
      /*/
      if (1 > 0 || mt_rand() / mt_getrandmax() < 0.5) {
        throw new \Exception('Some Fail');
      }
      //*/

      $this->process($msg);

      $ack();
    } catch (\Throwable $problem) {
      $retryCount = (int)($msg['retryCount'] ?? 0);
      $newRetryCount = $retryCount + 1;

      $this->logger->error($problem->getMessage(), [
        'throwable' => $problem
      ]);

      $producer = new Producer($this->getConfigRabbitMQ()->rabbitmqConfig);
      $producer->initialize();
      try {
        if ($newRetryCount < static::maxRetryCount) {
          $msg['retryCount'] = $newRetryCount;
          // Send to the balcony with a delay
          $producer->publish(
            $this->getConfigRabbitMQ()->getParams()->getServiceExchange(),
            $this->getConfigRabbitMQ()->getParams()->getDelayRoutingKey(),
            array_merge($msg, ['error' => $problem->getMessage()])
          );
        } else {
          // We send to the garden
          $producer->publish(
            $this->getConfigRabbitMQ()->getParams()->getServiceExchange(),
            $this->getConfigRabbitMQ()->getParams()->getFailedRoutingKey(),
            array_merge($msg, ['error' => $problem->getMessage()])
          );
        }
      } finally {
        $producer->disconnect();
        unset($producer);
      }

      $ack();
    }

    $this->logger->info(
      sprintf(
        '[RabbitMQ::%s] mem: %s >> stop',
        static::activityCode,
        Memory\Manager::getInstance()->getPeakMemoryUsage()
      )
    );
  }
  // endregion ////

  // region Process ////
  /**
   * @throws TransportException
   * @throws InvalidArgumentException
   * @throws UnknownScopeCodeException
   * @throws BaseException
   */
  public function process(
    $msg
  ): void
  {
    $entityTypeId = $msg['entityTypeId'] ?? 0;
    $entityId = $msg['entityId'] ?? 0;
    $workflowId = $msg['additionalData']['workflowId'] ?? null;
    $eventToken = $msg['additionalData']['eventToken'] ?? null;

    if (empty($eventToken)) {
      throw new InvalidArgumentException('eventToken is empty');
    }

    B24Service::setLogger($this->logger);
    $B24 = B24Service::getB24Service(
      $msg['auth']['memberId'] ?? null
    );

    try
    {
      if ($entityTypeId < 1) {
        throw new InvalidArgumentException('entityTypeId is empty');
      } elseif ($entityId < 1) {
        throw new InvalidArgumentException('entityId is empty');
      } elseif (empty($workflowId)) {
        throw new InvalidArgumentException('workflowId is empty');
      }
    }
    catch (\Exception $exception) {
      $B24->getBizProcScope()->activity()->log(
        $eventToken,
        sprintf('Error: %s', $exception->getMessage())
      );
      unset($B24);
      throw $exception;
    }

    $entityType = Crm\EnumEntityType::from($entityTypeId);
    $ufCrmTask = join('_', [$entityType->getEntityTypeAbbr(), $entityId]);

    $taskList = $this->getAllTasksForEntity($B24, $ufCrmTask);
    $ttl = count($taskList);
    $ttlTime = array_sum(array_column($taskList, 'timeSpentInLogs'));

    $hours = floor($ttlTime / 3600);
    $minutes = floor(($ttlTime % 3600) / 60);
    $seconds = $ttlTime % 60;
    $ttlTimeFormat = sprintf("%02d:%02d:%02d", $hours, $minutes, $seconds);

    $logMessage = sprintf('Success: mem: %s | ttl: %s | ttlTime: %s sec | $ttlTimeFormat : %s', Memory\Manager::getInstance()->getPeakMemoryUsage(), $ttl, $ttlTime, $ttlTimeFormat);
    $this->logger->debug($logMessage);

    $B24->getBizProcScope()->event()->send(
      $eventToken,
      [
        'ttlTask' => $ttl,
        'ttlTime' => $ttlTime,
        'ttlTimeFormat' => $ttlTimeFormat
      ],
      $logMessage
    );

    unset($B24, $hours, $minutes, $seconds, $ttlTimeFormat, $ufCrmTask, $entityType);
  }

  /**
   * Load all task from crm.entity.item
   *
   * @param ServiceBuilder $B24
   * @param string $ufCrmTask
   * @return array
   * @throws \Bitrix24\SDK\Core\Exceptions\BaseException
   * @throws \Bitrix24\SDK\Core\Exceptions\TransportException
   */
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
        '$iterator: %s | memory: %s | $lastId: %s | count: %s',
        $iterator,
        Memory\Manager::getInstance()->getPeakMemoryUsage(),
        $lastId,
        count($result)
      ));

      $filter = [
        '>ID' => $lastId,
        'UF_CRM_TASK' => $ufCrmTask
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
  // endregion ////

  /**
   * @inheritDoc
   */
  public function getGcInterval(): int
  {
    return 1_000;
  }

  /**
   * @inheritDoc
   */
  public function getSleepSeconds(): int
  {
    return 0;
  }

  /**
   * @inheritDoc
   */
  public function getSleepNanoseconds(): int
  {
    return 10_000_000;
  }
}

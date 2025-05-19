<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfigSomeDelayed
  extends IBuilderConfigSomeService
{
  /**
   * get Delay in ms (6000)
   * @return int
   */
  public function getDelayMs(): int;

  /**
   * 'activity.activityCode.delayed.6000.v1'
   * @return string
   */
  public function getDelayedQueueName(): string;

  /**
   * 'delay.activityCode.6000'
   * @return string
   */
  public function getDelayRoutingKey(): string;

  /**
   * 'activities.failed.v1'
   * @return string
   */
  public function getFailedQueueName(): string;

  /**
   * 'failed'
   * @return string
   */
  public function getFailedRoutingKey(): string;
}

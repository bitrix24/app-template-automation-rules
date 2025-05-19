<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfigSomeRouting
{
  /**
   * 'activities.v1'
   * @return string
   */
  public function getExchange(): string;

  /**
   * 'activity.activityCode.v1'
   * @return string
   */
  public function getQueueName(): string;

  /**
   * 'activity.activityCode'
   * @return string
   */
  public function getRoutingKey(): string;
}

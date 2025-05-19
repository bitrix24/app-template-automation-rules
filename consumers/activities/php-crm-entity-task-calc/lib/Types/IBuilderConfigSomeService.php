<?php

declare(strict_types=1);

namespace Bitrix24\RabbitMQ\Types;

interface IBuilderConfigSomeService
{
  /**
   * 'activities.service.v1'
   * @return string
   */
  public function getServiceExchange(): string;

  /**
   * 'activity.service.activityCode'
   * @return string
   */
  public function getServiceRoutingKey(): string;
}

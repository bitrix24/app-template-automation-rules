<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use Bitrix24\SDK\Application\Local\Repository\LocalAppAuthRepositoryInterface;
use Bitrix24\SDK\Core\Credentials\ApplicationProfile;
use Bitrix24\SDK\Core\Exceptions\InvalidArgumentException;
use Bitrix24\SDK\Core\Exceptions\UnknownScopeCodeException;
use Bitrix24\SDK\Events\AuthTokenRenewedEvent;
use Bitrix24\SDK\Services\ServiceBuilder;
use Bitrix24\SDK\Services\ServiceBuilderFactory;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Symfony\Component\EventDispatcher\EventDispatcher;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

class B24Service
{
  private static ?LoggerInterface $logger = null;

  public static function setLogger(LoggerInterface $logger): void
  {
    static::$logger = $logger;
  }

  public static function getLogger(): LoggerInterface {
    if (null === static::$logger) {
      static::$logger = new NullLogger();
    }

    return static::$logger;
  }

  /**
   * @throws InvalidArgumentException
   * @throws UnknownScopeCodeException
   */
  public static function getB24Service(
    null|string $memberId = null
  ): ServiceBuilder
  {
    // init bitrix24 service builder auth data from saved auth token
    static::getLogger()->debug('getB24Service.authFromAuthRepositoryStorage');

    if(null === $memberId) {
      throw new InvalidArgumentException('memberId is empty');
    }

    $authRepository = new AuthStorage(
      $memberId,
      self::getLogger()
    );

    $eventDispatcher = new EventDispatcher();
    $eventDispatcher->addListener(
      AuthTokenRenewedEvent::class,
      function (AuthTokenRenewedEvent $authTokenRenewedEvent)
        use ($authRepository): void
      {
        self::getLogger()->debug('onAuthTokenRenewedEventListener.start', [
          'expires' => $authTokenRenewedEvent->getRenewedToken()->authToken->expires
        ]);

        $authRepository->saveRenewedToken(
          $authTokenRenewedEvent->getRenewedToken()
        );

        self::getLogger()->debug('onAuthTokenRenewedEventListener.finish');
      }
    );

    $auth = $authRepository->getAuth();
    return (new ServiceBuilderFactory(
      $eventDispatcher,
      static::getLogger()
    ))->init(
      static::getApplicationProfile(),
      $auth->getAuthToken(),
      $auth->getDomainUrl()
    );
  }

  /**
   * Get Application profile from environment variables
   *
   * By default behavioral
   *
   * @throws UnknownScopeCodeException
   * @throws InvalidArgumentException
   */
  protected static function getApplicationProfile(): ApplicationProfile
  {
    static::getLogger()->debug('getApplicationProfile.start');
    $config = Config::getInstance();
    $profile = ApplicationProfile::initFromArray([
      'BITRIX24_PHP_SDK_APPLICATION_CLIENT_ID' => $config->appClientId,
      'BITRIX24_PHP_SDK_APPLICATION_CLIENT_SECRET' => $config->appClientSecret,
      'BITRIX24_PHP_SDK_APPLICATION_SCOPE' => $config->appScope
    ]);

    static::getLogger()->debug('getApplicationProfile.finish', [
      'appClientId' => $profile->clientId,
      'appScope' => $profile->scope->getScopeCodes(),
    ]);
    return $profile;
  }
}

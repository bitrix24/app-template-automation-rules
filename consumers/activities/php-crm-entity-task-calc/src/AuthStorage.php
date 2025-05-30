<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc;

use AppCrmEntityTaskCalc\Exceptions\AuthNotFoundException;
use Bitrix24\SDK\Application\Local\Entity\LocalAppAuth;
use Bitrix24\SDK\Application\Local\Repository\LocalAppAuthRepositoryInterface;
use Bitrix24\SDK\Core\Response\DTO\RenewedAuthToken;
use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception;
use Psr\Log\LoggerInterface;
use Doctrine\DBAL\DriverManager;

class AuthStorage
  implements LocalAppAuthRepositoryInterface
{
  protected Connection $conn;
  public function __construct(
    private string $memberId,
    private readonly LoggerInterface $logger
  )
  {
    $tmp = parse_url(Config::getInstance()->databaseUrl);
    $connectionParams = [
      'user' => $tmp['user'] ?? null,
      'password' => $tmp['pass'] ?? null,
      'host' => $tmp['host'] ?? null,
      'port' => $tmp['port'] ?? 0,
      'dbname' => str_replace('/', '', $tmp['path'] ?? ''),
      'driver' => 'pdo_pgsql',
    ];

    $this->conn = DriverManager::getConnection($connectionParams);
    unset($tmp, $connectionParams);
  }

  /**
   * Get Auth by MemberId & isFromAppInstall from DB
   *
   * @throws Exception
   */
  private function getDbRow(): array
  {
    return $this->conn->fetchAssociative(
      'SELECT *
        FROM "B24App"
        WHERE
          "memberId" = :memberId
          AND "isFromAppInstall" = :isFromAppInstall
        ORDER BY "id" ASC
        LIMIT 1
      ',
      [
        'memberId' => $this->memberId,
        'isFromAppInstall' => $this->conn->convertToDatabaseValue(true, 'boolean')
      ]
    ) ?? [];
  }

  /**
   * Init LocalAppAuth by DB
   *
   * @throws AuthNotFoundException
   * @throws Exception
   */
  private function getPayload(): LocalAppAuth
  {
    $row = $this->getDbRow();
    if (empty($row)) {
      throw new Exceptions\AuthNotFoundException('Not found auth in db');
    }

    $this->logger->debug('rowId: '.$row['id'], [
      'row' => $row
    ]);

    return LocalAppAuth::initFromArray([
      'auth_token' => [
        'access_token' => $row['accessToken'],
        'refresh_token' => $row['refreshToken'],
        'expires' => (int)$row['expires'],
      ],
      'domain_url' => sprintf('https://%s', str_replace(['https://', 'http://'], '', $row['domain'])),
      'application_token' => $row['applicationToken'],
    ]);
  }

  public function getAuth(): LocalAppAuth
  {
    $this->logger->debug('AppAuthFileStorage.getAuth.start');

    $localAppAuth = $this->getPayload();

    $this->logger->debug('AppAuthFileStorage.getAuth.finish');
    return $localAppAuth;
  }

  public function getApplicationToken(): ?string
  {
    $this->logger->debug('AppAuthFileStorage.getApplicationToken.start');
    try {
      $localAppAuth = $this->getPayload();
    }catch (\Throwable $exception){
      $this->logger->debug('AppAuthFileStorage.getApplicationToken.empty');
      return null;
    }

    $this->logger->debug('AppAuthFileStorage.getApplicationToken.finish');

    return $localAppAuth->getApplicationToken();
  }

  /**
   * @throws AuthNotFoundException
   * @throws Exception
   */
  public function saveRenewedToken(RenewedAuthToken $renewedAuthToken): void
  {
    $this->logger->debug('AppAuthFileStorage.saveRenewedToken.start');

    $row = $this->getDbRow();
    if (empty($row)) {
      throw new Exceptions\AuthNotFoundException('Not found auth in db');
    }

    $rowId = (int)$row['id'];
    $fields = [
      '"updatedAt"' => 'NOW()',
      '"accessToken"' => $renewedAuthToken->authToken->accessToken,
      '"refreshToken"' => $renewedAuthToken->authToken->refreshToken,
      '"expires"' => $renewedAuthToken->authToken->expires,
      '"expiresIn"' => $renewedAuthToken->authToken->expiresIn ?? 3600,
      /**
       * @memo at this place $renewedAuthToken->domain = 'oauth.bitrix.info' -> need self b24
       */
      // '"domain"' => $renewedAuthToken->domain,
      /**
       * @need fix phpSdk
       * @memo at this place $renewedAuthToken->applicationStatus->getStatusCode() = 'local' -> need 'L'
       */
      // '"status"' => $renewedAuthToken->applicationStatus->getStatusCode(),
      // '"clientEndpoint"' => $renewedAuthToken->clientEndpoint,
      // '"serverEndpoint"' => $renewedAuthToken->serverEndpoint
    ];

    $response = $this->conn->update(
      '"B24App"',
      $fields,
      [
        'id' => $rowId
      ]
    );

    $this->logger->debug('AppAuthFileStorage.saveRenewedToken.finish', [
      'memberId' => $this->memberId,
      'rowId' => $rowId,
      'fields' => $fields
    ]);
  }

  /**
   * @deprecated Not use in consumer. New Auth we add in event
   *
   * @param LocalAppAuth $localAppAuth
   * @return void
   *
   * @see frontend/server/api/event/onAppInstall.post.ts
   */
  public function save(LocalAppAuth $localAppAuth): void
  {
    throw new \LogicException('Not use this function');
  }
}

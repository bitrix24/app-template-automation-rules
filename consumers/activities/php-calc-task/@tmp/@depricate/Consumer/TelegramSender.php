<?php

declare(strict_types=1);

namespace Consumer\;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class TelegramSender {
  private Client $client;
  private string $apiUrl;
  private string $chatId;

  public function __construct(string $botToken, string $chatId, Client $client = null) {
    $this->apiUrl = sprintf("https://api.telegram.org/bot%s/sendMessage", $botToken);
    $this->chatId = $chatId;
    $this->client = $client ?? new Client();
  }

  public function send(string $message): void {
    try {
      $response = $this->client->post($this->apiUrl, [
        'form_params' => [
          'chat_id' => $this->chatId,
          'text' => $message,
        ],
        'timeout' => 5
      ]);

      if ($response->getStatusCode() !== 200) {
        throw new \RuntimeException('Telegram API returned non-200 status code');
      }
    } catch (GuzzleException $e) {
      throw new \RuntimeException('Telegram send failed: ' . $e->getMessage());
    }
  }
}

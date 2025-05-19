<?php

declare(strict_types=1);

namespace AppCrmEntityTaskCalc\Crm;

/**
 * CRM Object Type
 * @memo Not support SPA (DYNAMIC_*)
 *
 * @see https://apidocs.bitrix24.com/api-reference/crm/data-types.html#object_type
 */
enum EnumEntityType: int
{
  case LEAD = 1;
  case DEAL = 2;
  case CONTACT = 3;
  case COMPANY = 4;
  case INVOICE = 5;
  case SMART_INVOICE = 31;
  case QUOTE = 7;
  case REQUISITE = 8;
  case ORDER = 14;

  public function getEntityTypeName(): string
  {
    return match ($this) {
      self::LEAD => 'LEAD',
      self::DEAL => 'DEAL',
      self::CONTACT => 'CONTACT',
      self::COMPANY => 'COMPANY',
      self::INVOICE => 'INVOICE',
      self::SMART_INVOICE => 'SMART_INVOICE',
      self::QUOTE => 'QUOTE',
      self::REQUISITE => 'REQUISITE',
      self::ORDER => 'ORDER'
    };
  }

  public function getEntityTypeAbbr(): string
  {
    return match ($this) {
      self::LEAD => 'L',
      self::DEAL => 'D',
      self::CONTACT => 'C',
      self::COMPANY => 'CO',
      self::INVOICE => 'I',
      self::SMART_INVOICE => 'SI',
      self::QUOTE => 'Q',
      self::REQUISITE => 'RQ',
      self::ORDER => 'O'
    };
  }

  public function getUserFieldEntityId(): string
  {
    return match ($this) {
      self::LEAD => 'CRM_LEAD',
      self::DEAL => 'CRM_DEAL',
      self::CONTACT => 'CRM_CONTACT',
      self::COMPANY => 'CRM_COMPANY',
      self::INVOICE => 'CRM_INVOICE',
      self::SMART_INVOICE => 'CRM_SMART_INVOICE',
      self::QUOTE => 'CRM_QUOTE',
      self::REQUISITE => 'CRM_REQUISITE',
      self::ORDER => 'ORDER'
    };
  }

  public static function fromEntityTypeName(string $entityTypeName): self
  {
    foreach (self::cases() as $case) {
      if ($case->getEntityTypeName() === $entityTypeName) {
        return $case;
      }
    }
    throw new \ValueError("Unknown entity type name: $entityTypeName");
  }

  public static function tryFromEntityTypeName(string $entityTypeName): ?self
  {
    foreach (self::cases() as $case) {
      if ($case->getEntityTypeName() === $entityTypeName) {
        return $case;
      }
    }
    return null;
  }

  public static function fromEntityTypeAbbr(string $abbr): self
  {
    foreach (self::cases() as $case) {
      if ($case->getEntityTypeAbbr() === $abbr) {
        return $case;
      }
    }
    throw new \ValueError("Unknown entity type abbreviation: $abbr");
  }

  public static function tryFromEntityTypeAbbr(string $abbr): ?self
  {
    foreach (self::cases() as $case) {
      if ($case->getEntityTypeAbbr() === $abbr) {
        return $case;
      }
    }
    return null;
  }

  public static function fromUserFieldEntityId(string $userFieldId): self
  {
    foreach (self::cases() as $case) {
      if ($case->getUserFieldEntityId() === $userFieldId) {
        return $case;
      }
    }
    throw new \ValueError("Unknown user field entity ID: $userFieldId");
  }

  public static function tryFromUserFieldEntityId(string $userFieldId): ?self
  {
    foreach (self::cases() as $case) {
      if ($case->getUserFieldEntityId() === $userFieldId) {
        return $case;
      }
    }
    return null;
  }
}

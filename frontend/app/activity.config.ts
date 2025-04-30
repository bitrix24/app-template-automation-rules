import { EnumCrmEntityType } from '@bitrix24/b24jssdk'
import type { BoolString, B24LangList } from '@bitrix24/b24jssdk'

/**
 * @todo move to b24JsSdk
 */
export type PropertyType = 'bool' | 'date' | 'datetime' | 'double' | 'int' | 'select' | 'string' | 'text' | 'user'

/**
 * @todo move to b24JsSdk
 *
 * @link https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-add.html#property
 */
export interface ActivityProperty {
  Name: string | Partial<Record<B24LangList, string>>
  Description?: string | Record<string, string>
  Type: PropertyType
  Options?: Record<string | number, string>
  Required?: BoolString
  Multiple?: BoolString
  Default?: any
}

/**
 * @todo move to b24JsSdk
 *
 * @link https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-add.html#parametry-metoda
 */
export interface ActivityConfig {
  CODE: string
  HANDLER: string
  NAME: string | Partial<Record<B24LangList, string>>
  DESCRIPTION?: string | Partial<Record<B24LangList, string>>
  DOCUMENT_TYPE?: [string, string, string]
  PROPERTIES?: Record<string, ActivityProperty>
  RETURN_PROPERTIES?: Record<string, ActivityProperty>
  FILTER?: {
    INCLUDE?: Array<string | string[]>
    EXCLUDE?: Array<string | string[]>
  }
  USE_PLACEMENT?: BoolString
  PLACEMENT_HANDLER?: string
  USE_SUBSCRIPTION?: BoolString
  AUTH_USER_ID?: number
}

export interface ActivityOrRobotConfig extends Omit<ActivityConfig, 'HANDLER' | 'PLACEMENT_HANDLER' | 'NAME'> {
  type: 'activity' | 'robot'
  NAME?: ActivityConfig['NAME']
  HANDLER?: ActivityConfig['HANDLER']
  PLACEMENT_HANDLER?: ActivityConfig['PLACEMENT_HANDLER']
}

/**
 * @todo fix properties lang
 */
export const activitiesConfig: ActivityOrRobotConfig[] = [
  {
    type: 'robot',
    CODE: 'AIandMachineLearning',
    FILTER: {
      INCLUDE: [
        /**
         * @todo add b24JsSdk
         */
        ['crm', 'CCrmDocumentLead'],
        ['crm', 'CCrmDocumentDeal'],
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\Quote'],
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\SmartInvoice'],
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\Dynamic'],
        /**
         * @todo test this
         */
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\Order']
      ]
    },
    /**
     * @todo fix this
     */
    USE_SUBSCRIPTION: 'N',
    AUTH_USER_ID: 1,
    HANDLER: '/api/activities/AIandMachineLearning',
    USE_PLACEMENT: 'Y',
    PLACEMENT_HANDLER: '/setting/AIandMachineLearning',
    PROPERTIES: {
      entityTypeId: {
        Required: 'Y',
        Name: 'entityTypeId',
        Type: 'select',
        Options: {
          [EnumCrmEntityType.lead]: 'Lead',
          [EnumCrmEntityType.deal]: 'Deal',
          [EnumCrmEntityType.quote]: 'Quote',
          [EnumCrmEntityType.invoice]: 'Invoice',
          [EnumCrmEntityType.order]: 'Order',
          CrmDynamic: 'SPA'
        }
      },
      entityId: {
        Required: 'Y',
        Name: 'entity Id',
        Type: 'int'
      }
    },
    RETURN_PROPERTIES: {
      documentId: {
        Name: 'Rendered document id',
        Type: 'int'
      }
    }
  },
  {
    type: 'activity',
    CODE: 'AppMarketplace',
    FILTER: {
      INCLUDE: [
        /**
         * @todo add b24JsSdk
         */
        ['crm', 'CCrmDocumentLead'],
        ['crm', 'CCrmDocumentDeal'],
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\Quote'],
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\SmartInvoice'],
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\Dynamic'],
        /**
         * @todo test this
         */
        ['crm', 'Bitrix\\Crm\\Integration\\BizProc\\Document\\Order']
      ]
    },
    USE_SUBSCRIPTION: 'Y',
    AUTH_USER_ID: 1,
    USE_PLACEMENT: 'Y',
    PROPERTIES: {
      entityTypeId: {
        Required: 'Y',
        Name: 'entityTypeId',
        Type: 'select',
        Options: {
          [EnumCrmEntityType.lead]: 'Lead',
          [EnumCrmEntityType.deal]: 'Deal',
          [EnumCrmEntityType.quote]: 'Quote',
          [EnumCrmEntityType.invoice]: 'Invoice',
          [EnumCrmEntityType.order]: 'Order',
          CrmDynamic: 'SPA'
        }
      },
      entityId: {
        Required: 'Y',
        Name: 'entity Id',
        Type: 'int'
      }
    },
    RETURN_PROPERTIES: {
      documentId: {
        Name: 'Rendered document id',
        Type: 'int'
      }
    }
  },
  {
    type: 'activity',
    CODE: 'BlockchainTechnology'
  }
]

import { EnumCrmEntityType, getDocumentTypeForFilter, EnumBizprocDocumentType, ActivityOrRobotConfig } from '@bitrix24/b24jssdk'

/**
 * @need fix lang
 */
export const activitiesConfig: ActivityOrRobotConfig[] = [
  // nodejs-pdf-from-html
  {
    type: 'robot',
    CODE: 'PdfFromHtml',
    FILTER: {
      INCLUDE: [
        getDocumentTypeForFilter(EnumBizprocDocumentType.lead),
        getDocumentTypeForFilter(EnumBizprocDocumentType.deal)
      ]
    },
    USE_SUBSCRIPTION: 'N',
    AUTH_USER_ID: 1,
    HANDLER: '/api/activities/PdfFromHtml',
    USE_PLACEMENT: 'Y',
    PLACEMENT_HANDLER: '/setting/PdfFromHtml',
    PROPERTIES: {
      entityTypeId: {
        Required: 'Y',
        Name: 'Entity Type',
        Type: 'select',
        Options: {
          [EnumCrmEntityType.lead]: 'Lead',
          [EnumCrmEntityType.deal]: 'Deal',
          [EnumCrmEntityType.quote]: 'Quote',
          [EnumCrmEntityType.invoice]: 'Invoice'
        }
      },
      entityId: {
        Required: 'Y',
        Name: 'Entity Id',
        Type: 'int'
      }
    },
    RETURN_PROPERTIES: {
      documentId: {
        Name: 'rendered document id',
        Type: 'int'
      }
    }
  },
  // php-crm-entity-task-calc
  {
    type: 'robot',
    CODE: 'CrmEntityTaskCalc',
    FILTER: {
      INCLUDE: [
        getDocumentTypeForFilter(EnumBizprocDocumentType.lead),
        getDocumentTypeForFilter(EnumBizprocDocumentType.deal)
      ]
    },
    USE_SUBSCRIPTION: 'Y',
    AUTH_USER_ID: 1,
    USE_PLACEMENT: 'N',
    RETURN_PROPERTIES: {
      ttlTask: {
        Name: 'ttlTask',
        Type: 'int'
      },
      ttlTime: {
        Name: 'ttlTime',
        Type: 'int'
      },
      ttlTimeFormat: {
        Name: 'ttlTimeFormat',
        Type: 'string'
      }
    }
  }
]

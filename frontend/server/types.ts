import type { Message } from '@bitrix24/b24rabbitmq'
import type { EnumCrmEntityTypeId, B24OAuthParams } from '@bitrix24/b24jssdk'

export interface Options {
  entityTypeId: EnumCrmEntityTypeId
  entityId: number
  workflowId: string
  eventToken: string
  code: string
  useSubscription: boolean
  timeoutDuration: number
  ts: number
  documentId: string[]
  documentType: string[]
  properties: Record<string, any>
  auth: B24OAuthParams
}

export interface MessageWithAuth extends Message {
  auth: B24OAuthParams
}

import type { Message } from '@bitrix24/b24rabbitmq'
import type { EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'

/**
 * @todo move to jsSdk
 */
export interface Auth {
  applicationToken: string
  userId: string
  memberId: string
  accessToken: string
  refreshToken: string
  expires: string
  expiresIn: string
  scope: string
  domain: string
  clientEndpoint: string
  serverEndpoint: string
  status: string
}

export interface Options {
  entityTypeId: EnumCrmEntityTypeId
  entityId: number
  workflowId?: string
  eventToken?: string
  code: string
  useSubscription: boolean
  timeoutDuration: number
  ts: number
  documentId: string[]
  documentType: string[]
  properties: Record<string, any>
  auth: Auth
}

export interface MessageWithAuth extends Message {
  auth: Auth
}

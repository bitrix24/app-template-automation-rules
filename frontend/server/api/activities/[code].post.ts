/**
 * @todo fix this
 * @todo test under not admin use !!
 *
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-log.html
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-robot/bizproc-event-send.html
 */
import type { BoolString } from '@bitrix24/b24jssdk'
import { EnumAppStatus, EnumCrmEntityTypeId, omit } from '@bitrix24/b24jssdk'
import * as qs from 'qs-esm'
import { Salt } from '~/services/salt'
import { RabbitMQProducer } from '@bitrix24/b24rabbitmq'
import { rabbitMQConfig } from '../../rabbitmq.config'
import type { MessageWithAuth, Options } from '~~/server/types'

const { clearSalt } = Salt()

// region fix by @b24 ////

// { workflow_id: '681c894d3f0ec8.54818143',
//   code: 'AIandMachineLearning____dev',
//   document_id: [ 'crm', 'CCrmDocumentDeal', 'DEAL_1188' ],
//   document_type: [ 'crm', 'CCrmDocumentDeal', 'DEAL' ],
//   event_token:
//   '681c894d3f0ec8.54818143|A36717_5720_22885_29158|X3QpQY6RKFD8ULUtOiKllFEZLUaVuDYn.29c803f2e57290aade3fcfcb061b2aa2d26f682deddb9de32f556040c6041901',
//     properties: { entityTypeId: 'CRM_DEAL', entityId: '1188' },
//   use_subscription: 'N',
//     timeout_duration: '0',
//   ts: '1746700621',
//   auth:
//   { access_token: '5d971c6800782a4e000011e7000000010000005599262cf2ead07da4b5dd68fb55479e',
//     expires: '1746704221',
//     expires_in: '3600',
//     scope: 'crm,catalog,bizproc,placement,user_brief',
//     domain: 'bel.bitrix24.ru',
//     server_endpoint: 'https://oauth.bitrix.info/rest/',
//     status: 'L',
//     client_endpoint: 'https://bel.bitrix24.ru/rest/',
//     member_id: '3d906b2a32030386ccc7274d2313a01b',
//     user_id: '1',
//     refresh_token: '4d16446800782a4e000011e700000001000000196f6f744d817fac72c4f1c9ad438dd4',
//     application_token: '565be534fe44bce005bae699aa0313f8' } }

/**
 * @todo fix by @b24
 */
interface HandlerAuthParams {
  access_token: string
  expires: string
  expires_in: string
  scope: string
  domain: string
  server_endpoint: string
  status: string
  client_endpoint: string
  member_id: string
  user_id: string
  refresh_token: string
  application_token: string
}

/**
 * @todo fix by @b24
 */
interface ActivityHandlerParams {
  event_token: string
  workflow_id: string
  code: string
  document_id: string[]
  document_type: string[]
  properties?: Record<string, string>
  use_subscription: BoolString
  timeout_duration: string
  ts: string
  auth: HandlerAuthParams
}

/**
 * @todo fix by @b24
 */
enum EnumBizprocDocumentType {
  undefined = 'undefined',
  lead = 'CCrmDocumentLead',
  deal = 'CCrmDocumentDeal',
  contact = 'CCrmDocumentContact',
  company = 'CCrmDocumentCompany',
  /**
   * @todo test this
   */
  oldInvoice = 'CCrmDocumentSmartInvoice',
  quote = 'CCrmDocumentSmartQuote',
  order = 'CCrmDocumentSmartOrder'
}

/**
 * @todo test this
 */
function convertBizprocDocumentTypeToCrmEntityTypeId(documentType: EnumBizprocDocumentType): EnumCrmEntityTypeId {
  switch (documentType) {
    case EnumBizprocDocumentType.lead:
      return EnumCrmEntityTypeId.lead
    case EnumBizprocDocumentType.deal:
      return EnumCrmEntityTypeId.deal
    case EnumBizprocDocumentType.contact:
      return EnumCrmEntityTypeId.contact
    case EnumBizprocDocumentType.company:
      return EnumCrmEntityTypeId.company
    case EnumBizprocDocumentType.oldInvoice:
      return EnumCrmEntityTypeId.oldInvoice
    case EnumBizprocDocumentType.quote:
      return EnumCrmEntityTypeId.quote
    case EnumBizprocDocumentType.order:
      return EnumCrmEntityTypeId.order
  }

  return EnumCrmEntityTypeId.undefined
}

/**
 * @todo fix by @b24
 */
export function getEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: string | number
): T[keyof T] | undefined {
  return (Object.values(enumObj) as (string | number)[]).includes(value)
    ? value as T[keyof T]
    : undefined
}
// endregion ////

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = qs.parse(body) as unknown as Partial<ActivityHandlerParams>

  const options: Options = {
    code: clearSalt(data?.code || 'notSetCodeOptions'),
    entityTypeId: EnumCrmEntityTypeId.undefined,
    entityId: 0,
    workflowId: (data?.workflow_id || '?'),
    eventToken: (data?.event_token || '?'),
    useSubscription: data?.use_subscription === 'Y',
    timeoutDuration: Number.parseInt(data?.timeout_duration || '0'),
    ts: Number.parseInt(data?.ts || '0'),
    documentId: data?.document_id
      ? [
          data.document_id[0],
          data.document_id[1],
          data.document_id[2]
        ].filter(Boolean)
      : [],
    documentType: data?.document_type
      ? [
          data.document_type[0],
          data.document_type[1],
          data.document_type[2]
        ].filter(Boolean)
      : [],
    properties: {},
    auth: {
      applicationToken: data?.auth?.application_token || '?',
      userId: Number.parseInt(data?.auth?.user_id || '0'),
      memberId: data?.auth?.member_id || '?',
      accessToken: data?.auth?.access_token || '?',
      refreshToken: data?.auth?.refresh_token || '?',
      expires: Number.parseInt(data?.auth?.expires || '0'),
      expiresIn: Number.parseInt(data?.auth?.expires_in || '3600'),
      scope: data?.auth?.scope || '',
      domain: data?.auth?.domain || '',
      clientEndpoint: data?.auth?.client_endpoint || '?',
      serverEndpoint: data?.auth?.server_endpoint || '?',
      status: data?.auth?.status || EnumAppStatus.Free
    }
  }

  if (options.documentType[1]) {
    options.entityTypeId = convertBizprocDocumentTypeToCrmEntityTypeId(
      getEnumValue(EnumBizprocDocumentType, options.documentType[1]) || EnumBizprocDocumentType.undefined
    )
  }

  const match = options.documentId[2].match(/_(\d+)$/)
  if (!match) {
    options.entityId = 0
  } else {
    const value = Number.parseInt(match[1], 10)
    options.entityId = Number.isNaN(value) ? 0 : value
  }

  try {
    return await handleActivity(options)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERROR_ACTIVITY_HANDLE'
    })
  }
})

async function handleActivity(options: Options) {
  const activityCode = options.code

  console.log('come >> ', options.code)
  if (!options.workflowId
    || options.entityTypeId === EnumCrmEntityTypeId.undefined
    || options.entityId < 1
  ) {
    throw createError({ statusCode: 400, message: 'Invalid request' })
  }

  const producer = new RabbitMQProducer(rabbitMQConfig)
  try {
    await producer.initialize()

    const message: MessageWithAuth = {
      routingKey: `activity.${activityCode}`,
      date: new Date().toISOString(),
      entityTypeId: options.entityTypeId,
      entityId: options.entityId,
      auth: options.auth,
      additionalData: { ...omit(options, ['auth', 'entityTypeId', 'entityId']) }
    }

    await producer.publish(
      'activities',
      message.routingKey,
      message
    )

    console.log(`[RabbitMQ::${activityCode}] publish`, [message.routingKey, message.entityTypeId, message.entityId].join(' | '))
  } catch (error) {
    const problem = error instanceof Error ? error : new Error(`[RabbitMQ::${activityCode}] publish error`, { cause: error })
    console.error(problem)

    throw problem
  } finally {
    await producer.disconnect()
  }

  console.log(`[RabbitMQ::${activityCode}] queued`)

  return { status: 'queued' }
}

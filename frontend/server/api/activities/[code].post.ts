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
import prisma from '../../utils/prisma'

const { clearSalt } = Salt()

// region fix by @b24 ////
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

  // region Init Options ////
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
      memberId: data?.auth?.member_id || 'notSet',
      accessToken: data?.auth?.access_token || '?',
      refreshToken: data?.auth?.refresh_token || '?',
      expires: Number.parseInt(data?.auth?.expires || '0'),
      expiresIn: Number.parseInt(data?.auth?.expires_in || '3600'),
      scope: data?.auth?.scope || '',
      domain: data?.auth?.domain || '',
      clientEndpoint: data?.auth?.client_endpoint || '?',
      serverEndpoint: data?.auth?.server_endpoint || '?',
      status: data?.auth?.status || EnumAppStatus.Free
      // @todo add to jsSdk
      // issuer: 'request'
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
  // endregion ////

  console.log('Current AUTH', options.auth)

  // region Check memberId ////
  const appRow = await prisma.b24App.findFirst({
    where: {
      memberId: options.auth.memberId
    }
  })

  console.log('DB AUTH', appRow)

  if (!appRow) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERROR_ACTIVITY_HANDLE_memberId'
    })
  }
  // endregion ////

  // region Restore Auth From DB ////
  if (options.auth.accessToken === '?') {
    console.log('EMPTY AUTH come', options.auth, appRow)

    options.auth.applicationToken = appRow.applicationToken
    options.auth.userId = appRow.userId
    options.auth.accessToken = appRow.accessToken
    options.auth.refreshToken = appRow.refreshToken
    options.auth.expires = appRow.expires
    options.auth.expiresIn = appRow.expiresIn
    options.auth.scope = appRow.scope
    options.auth.domain = appRow.domain
    options.auth.clientEndpoint = appRow.clientEndpoint
    options.auth.serverEndpoint = appRow.serverEndpoint
    options.auth.status = appRow.status
    // @todo add to jsSdk
    // options.auth.issuer = 'db'
  }
  // endregion ////

  try {
    return await handleActivity(options)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'ERROR_ACTIVITY_HANDLE_handleActivity'
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

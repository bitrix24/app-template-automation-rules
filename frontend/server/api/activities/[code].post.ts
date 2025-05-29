/**
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-log.html
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-robot/bizproc-event-send.html
 */
import { EnumAppStatus, EnumCrmEntityTypeId, EnumBizprocDocumentType, convertBizprocDocumentTypeToCrmEntityTypeId, getEnumValue, omit } from '@bitrix24/b24jssdk'
import type { ActivityHandlerParams } from '@bitrix24/b24jssdk'
import * as qs from 'qs-esm'
import { Salt } from '~/services/salt'
import { RabbitMQProducer } from '@bitrix24/b24rabbitmq'
import { rabbitMQConfig } from '../../rabbitmq.config'
import type { MessageWithAuth, Options } from '~~/server/types'
import { prisma } from '~~/utils/prisma'

const { clearSalt } = Salt()

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
    properties: data?.properties || {},
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
      status: Object.values(EnumAppStatus).find(value => value === data?.auth?.status) || EnumAppStatus.Free,
      issuer: 'request'
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
    if (import.meta.dev) {
      console.error(`The database did not find authorization by memberId <${options.auth.memberId}> from the onAppInstall event.\nMost likely, you cleared the b24App table.\nYou need to reinstall the application in B24`)
    }

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
    options.auth.status = Object.values(EnumAppStatus).find(value => value === appRow.status) || EnumAppStatus.Free
    options.auth.issuer = 'store'
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

  console.log('come >> ', activityCode)
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
      'activities.v1',
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

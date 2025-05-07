/**
 * @todo fix this
 *
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-log.html
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-robot/bizproc-event-send.html
 */
import { EnumCrmEntityTypeId, omit } from '@bitrix24/b24jssdk'
import { Salt } from '~/services/salt'
import { RabbitMQProducer } from '@bitrix24/b24rabbitmq'
import { rabbitMQConfig } from '../../rabbitmq.config'
import type { Options, MessageWithAuth } from '~~/server/types'

const { clearSalt } = Salt()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const options: Options = {
    code: clearSalt(body?.code || 'notSetCodeOptions'),
    entityTypeId: EnumCrmEntityTypeId.undefined,
    entityId: 0,
    workflowId: (body?.workflow_id || null),
    eventToken: (body?.event_token || null),
    useSubscription: body?.use_subscription === 'Y',
    timeoutDuration: Number.parseInt(body?.timeout_duration || '0'),
    ts: Number.parseInt(body?.ts || '0'),
    documentId: [
      body['document_id[0]'] || null,
      body['document_id[1]'] || null,
      body['document_id[2]'] || null
    ].filter(Boolean),
    documentType: [
      body['document_type[0]'] || null,
      body['document_type[1]'] || null,
      body['document_type[2]'] || null
    ].filter(Boolean),
    properties: {},
    auth: {
      applicationToken: body['auth[application_token]'] || 'empty',
      userId: body['auth[user_id]'] || 'empty',
      memberId: body['auth[member_id]'] || 'empty',
      accessToken: body['auth[access_token]'] || 'empty',
      refreshToken: body['auth[access_token]'] || 'empty',
      expires: body['auth[expires]'] || '0',
      expiresIn: body['auth[expires_in]'] || '3600',
      scope: body['auth[scope]'] || 'empty',
      domain: body['auth[domain]'] || 'empty',
      clientEndpoint: body['auth[client_endpoint]'] || 'empty',
      serverEndpoint: body['auth[server_endpoint]'] || 'empty',
      status: body['auth[status]'] || 'empty'
    }
  }

  /**
   * @todo move to jsSdk
   */
  if (options.documentType[1]) {
    switch (options.documentType[1]) {
      case 'CCrmDocumentLead':
        options.entityTypeId = EnumCrmEntityTypeId.lead
        break
      case 'CCrmDocumentDeal':
        options.entityTypeId = EnumCrmEntityTypeId.deal
        break
      case 'CCrmDocumentContact':
        options.entityTypeId = EnumCrmEntityTypeId.contact
        break
      case 'CCrmDocumentCompany':
        options.entityTypeId = EnumCrmEntityTypeId.company
        break
      /**
       * @todo test this
       */
      case 'CCrmDocumentSmartInvoice':
        options.entityTypeId = EnumCrmEntityTypeId.invoice
        break
      case 'CCrmDocumentSmartQuote':
        options.entityTypeId = EnumCrmEntityTypeId.quote
        break
      case 'CCrmDocumentSmartOrder':
        options.entityTypeId = EnumCrmEntityTypeId.order
        break
    }
  }

  if (options.documentId[2] && options.documentType[2]) {
    options.entityId = Number.parseInt(options.documentId[2].replace(`${options.documentType[2]}_`, '') || '0')
  }

  try {
    const response = await handleActivity(options)
    return response
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

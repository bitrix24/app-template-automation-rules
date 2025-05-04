/**
 * @todo fix this
 *
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-log.html
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-robot/bizproc-event-send.html
 */
import jwt from 'jsonwebtoken'
import { generatePDF } from './../../utils/pdf-generator'
import { Text, EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import { Salt } from '~/services/salt'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { RabbitMQService } from '../../services/rabbitmq.service'

/**
 * @todo remove this
 */
import axios from 'axios'

/**
 * @todo move to jsSdk
 */
export interface UploadDocumentResponse {
  result?: {
    document: {
      id: string
      pdfUrl: string
      downloadUrlMachine: string
      downloadUrl: string
      pdfUrlMachine: string
      publicUrl?: string
      emailDiskFile: string
      number: string
      title: string
    }
  }
  error?: string
}

/**
 * @todo move to jsSdk
 */
export interface UploadDocumentRequest {
  entityTypeId: number
  entityId: number
  title: string
  region: string
  number: string
  fileContent: string
  pdfContent?: string
  imageContent?: string
  auth: string
  refresh_token: string
}

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

/**
 * [Object: null prototype] {
 *   workflow_id: '6cccca097.21326861',
 *   code: 'AIandMachineLearning',
 *   'document_id[0]': 'crm',
 *   'document_id[1]': 'CCrmDocumentDeal',
 *   'document_id[2]': 'DEAL_1188',
 *   'document_type[0]': 'crm',
 *   'document_type[1]': 'CCrmDocumentDeal',
 *   'document_type[2]': 'DEAL',
 *   event_token:
 *    '6cccccc1a097.21326861|A91314_7cc_64977_86105|w72ccccvh2Sgyr6WxT.f7e381c918516eccc1541bxxxxba65',
 *   'properties[entityTypeId]': 'CRM_DEAL',
 *   'properties[entityId]': '1188',
 *   use_subscription: 'N',
 *   timeout_duration: '0',
 *   ts: '1745994253',
 *   'auth[access_token]': '1xxxxx1694',
 *   'auth[expires]': '1745997853',
 *   'auth[expires_in]': '3600',
 *   'auth[scope]': 'crm,catalog,bizproc,placement,user_brief',
 *   'auth[domain]': 'xxx.bitrix24.com',
 *   'auth[server_endpoint]': 'https://oauth.bitrix.info/rest/',
 *   'auth[status]': 'L',
 *   'auth[client_endpoint]': 'https://xxx.bitrix24.com/rest/',
 *   'auth[member_id]': '3d906b2a32030386ccc7274d2313a01b',
 *   'auth[user_id]': '1',
 *   'auth[refresh_token]': '0xxxx4e000011e700000001000000260dc83b47c40e9b5fd501093674c4f5',
 *   'auth[application_token]': '5xxxx34fe44bce005bae699aa0313f8' }
 * @param body
 */

const { clearSalt, addSalt } = Salt()

export default defineEventHandler(async (event) => {
  const { code: codeWithSaltFromParams } = event.context.params
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

  // console.log(
  //   '>>>',
  //   options
  // )

  switch (options.code) {
    case 'AIandMachineLearning':
      return handleAIandMachineLearning(options)
    default:
      throw createError({ statusCode: 404 })
  }
})

export interface RabbitMqEvent {
  eventDate: string
  entityTypeId: number
  entityId: number
  authToken: string
  eventType: string
  additionalData?: Record<string, any>
}

async function handleAIandMachineLearning(options: Options) {
  console.log('come >> ', options.code)
  if (!options.workflowId
    || options.entityTypeId === EnumCrmEntityTypeId.undefined
    || options.entityId < 1
  ) {
    throw createError({ statusCode: 400, message: 'Invalid request' })
  }

  const config = useRuntimeConfig()
  // Generate JWT token
  const token = jwt.sign(
    {
      entityTypeId: options.entityTypeId,
      entityId: options.entityId,
      timestamp: Date.now()
    },
    config.jwtSecret,
    { expiresIn: '5m' }
  )

  // region send RabbitMq ////

  try {
    const message: RabbitMqEvent = {
      eventDate: new Date().toISOString(),
      entityTypeId: options.entityTypeId,
      entityId: options.entityId,
      authToken: options.auth.accessToken,
      eventType: options.code,
      additionalData: options
    }
    console.log('RabbitMq >> ', message)
    const rabbitService = new RabbitMQService(addSalt('activity'))
    await rabbitService.publishToQueue(
      addSalt('activity'),
      JSON.stringify(message)
    )
  } catch (error) {
    console.error('RabbitMQ Error:', error instanceof Error ? error.message : error)
  }
  console.log('RabbitMq << queued')
  // endregion ////

  let documentId = 0

  // console.log('start gen >> ', `/render/invoice-by-deal/${options.entityId}/`)
  // const pdfBuffer = await generatePDF(
  //   `/render/invoice-by-deal/${options.entityId}/`,
  //   { token, entityId: options.entityId }
  // )
  // console.log('stop gen')
  // /**
  //  * @see https://apidocs.bitrix24.com/api-reference/crm/document-generator/documents/crm-document-generator-document-upload.html
  //  */
  //
  //
  // console.log('make send to b24 >> ')
  //
  // // region getEmpty docx ////
  // // const fileDocxPath = resolve(process.cwd(), 'server/assets/empty.docx')
  // // const fileDocxBuffer = await readFile(fileDocxPath)
  // // endregion ////
  //
  // try {
  // //   const response = await uploadDocument(
  // //     options.auth.clientEndpoint,
  // //     {
  // //       entityTypeId: options.entityTypeId,
  // //       entityId: options.entityId,
  // //       title: [options.code, options.entityTypeId, options.entityId].join(':'),
  // //       region: 'ru',
  // //       number: Text.getUuidRfc4122(),
  // //       refresh_token: options.auth.refreshToken,
  // //       auth: options.auth.accessToken,
  // //       pdfContent: Buffer.from(pdfBuffer).toString('base64'),
  // //       fileContent: 'empty' // fileDocxBuffer.toString('base64')
  // //     }
  // //   )
  // // documentId = Number.parseInt(response.result?.document.id || '0')
  //
  //   // console.log('Document uploaded')
  // } catch (error) {
  //   console.error('Error:', error instanceof Error ? error.message : error)
  // }

  console.log('stop send to b24 >> documentId: ', documentId)

  return {
    auth: options.auth.accessToken,
    event_token: options.eventToken,
    log_message: `>> success >>> ${options.code}`,
    return_values: {
      documentId
    }
  }
}

const uploadDocument = async (b24Url: string, params: UploadDocumentRequest): Promise<UploadDocumentResponse> => {
  // const client_id = 'local.zzz.yyyy'
  // const client_secret = 'zzDDxxx'
  try {
    const api = axios.create({
      // baseURL: b24Url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    api.interceptors.request.use(
      (config) => {
        console.log('------------')
        console.log(config)
        console.log('------------')

        return config
      })
    //
    // const apiAuth = axios.create({
    //   baseURL: 'https://oauth.bitrix.info/',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //   }
    // })
    //
    // console.log('Auth >>', '/oauth/token/', { grant_type: 'refresh_token', client_id, client_secret, refresh_token: params.refresh_token })
    // const responseAuth = await apiAuth.get<UploadDocumentResponse>(
    //   'oauth/token/',
    //   { params: {grant_type: 'refresh_token', client_id, client_secret, refresh_token: params.refresh_token }}
    // )
    //
    // if (responseAuth.data?.error) {
    //   console.error('<< Auth', responseAuth.data)
    //   throw new Error(responseAuth.data.error)
    // }
    // // console.log('<< Auth', responseAuth.data)
    //
    // params.auth = responseAuth.data.access_token
    // console.log('TEST >>', b24Url, 'crm.items.get', { entityTypeId: params.entityTypeId, id: params.entityId, auth: params.auth })
    // const response2 = await api.post<UploadDocumentResponse>(
    //   'crm.item.get.json',
    //   { entityTypeId: params.entityTypeId, id: params.entityId, auth: params.auth }
    // )
    //
    // if (response2.data?.error) {
    //   console.log('<< TEST ', response2.data)
    //   throw new Error(response2.data.error)
    // }
    // console.log('<< TEST ', response2.data?.result?.item?.id)

    // console.log('>>', b24Url, 'crm.documentgenerator.document.upload', params)

    const response = await api.post<UploadDocumentResponse>(
      `https://bel.bitrix24.ru/rest/crm.documentgenerator.document.upload.json`,
      {
        fields: params,
        auth: params.auth
      }
    )

    if (response.data?.error) {
      // console.log('<< TEST ', response.data)
      throw new Error(response.data.error)
    }

    // console.log('<< ', response.data)

    return response.data as UploadDocumentResponse
  } catch (error) {
    console.error('<< ', error)
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.message}`)
    }
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

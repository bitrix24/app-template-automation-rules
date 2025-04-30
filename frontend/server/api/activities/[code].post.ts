/**
 * @todo fix this
 *
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-activity/bizproc-activity-log.html
 * @see https://apidocs.bitrix24.com/api-reference/bizproc/bizproc-robot/bizproc-event-send.html
 */
import jwt from 'jsonwebtoken'
import { generatePDF } from './../../utils/pdf-generator'
import { Text, EnumCrmEntityType, EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
/**
 * @todo remove this
 */
import axios from 'axios'

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

export default defineEventHandler(async (event) => {
  const { code } = event.context.params
  const body = await readBody(event)

  switch(code) {
    case 'AIandMachineLearning':
      return handleAIandMachineLearning(body)
    default:
      throw createError({ statusCode: 404 })
  }
})

/**
 * @todo move to jsSdk
 */
export interface UploadDocumentRequest {
  entityTypeId: number
  entityId: string
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

async function handleAIandMachineLearning(body: any) {

  /**
   * @todo fix this
   */
  const {
    workflow_id,
    code,
    event_token,
    //'properties[entityTypeId]': entityTypeId,
    'properties[entityId]': entityId,
    use_subscription,
    'auth[access_token]': access_token,
    'auth[refresh_token]': refresh_token,
    'auth[client_endpoint]': client_endpoint,
    auth
  } = body
  const entityTypeId = EnumCrmEntityTypeId.deal
  console.log('come >> ', code, body)
  if (!workflow_id || !entityTypeId || !entityId) {
    throw createError({ statusCode: 400, message: 'Invalid request' })
  }

  const config = useRuntimeConfig()
  // Generate JWT token
  const token = jwt.sign(
    { entityTypeId, entityId, timestamp: Date.now() },
    config.jwtSecret,
    { expiresIn: '5m' }
  )

  console.log('start gen >> ', `/render/invoice-by-deal/${entityId}/`)
  const pdfBuffer = await generatePDF(
    `/render/invoice-by-deal/${entityId}/`,
    { token, entityId }
  )
  console.log('stop gen')
  /**
   * @see https://apidocs.bitrix24.com/api-reference/crm/document-generator/documents/crm-document-generator-document-upload.html
   */
  let documentId = 0

  console.log('make send to b24 >> ')
  try {
    const response = await uploadDocument(
      client_endpoint || '',
      {
        entityTypeId: entityTypeId,
        entityId: entityId,
        title: "demoFile",
        region: "ru",
        number: Text.getUuidRfc4122(),
        auth: access_token || '',
        refresh_token: refresh_token || '',
        // fileContent: Buffer.from(pdfBuffer).toString('base64'),
        pdfContent: Buffer.from(pdfBuffer).toString('base64'),
        fileContent: 'empty',
        // pdfContent: '456'
      })
    console.log('Document uploaded:', response.result);

    documentId = Number.parseInt(response.result?.document.id || '0')
  } catch (e) {
    console.error('Error:', e.message);
  }
  console.log('stop send to b24 >> ', documentId)

  return {
    auth: access_token,
    event_token,
    log_message: 'AIandMachineLearning >> success',
    return_values: {
      documentId
    }
  }
}

const uploadDocument = async (b24Url: string, params: UploadDocumentRequest): Promise<UploadDocumentResponse> => {
  const client_id = 'local.zzz.yyyy'
  const client_secret = 'zzDDxxx'
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
      //console.log('<< TEST ', response.data)
      throw new Error(response.data.error)
    }

    //console.log('<< ', response.data)

    return response.data as UploadDocumentResponse
  } catch (error) {
    console.error('<< ', error)
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.message}`)
    }
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

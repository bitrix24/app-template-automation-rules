import { consola } from 'consola'
import { RabbitMQConsumer } from '@bitrix24/b24rabbitmq'
import { Text, EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import { rabbitMQConfig } from './rabbitmq.config'
import type { MessageWithAuth, UploadDocumentRequest, UploadDocumentResponse } from './types'
import { generatePDF } from './utils/pdf-generator'
import { config } from 'dotenv'
/**
 * @todo remove this
 */
import axios from 'axios'

config({ path: '.env' })

const activityCode = 'AIandMachineLearning'

const startConsumer = async () => {
  const consumer = new RabbitMQConsumer(rabbitMQConfig)
  await consumer.initialize()
  const queueName = `activity.${activityCode}`

  consola.log(`Consumer for ${activityCode} started ...`)

  consumer.registerHandler(
    queueName,
    async (
      msg: MessageWithAuth,
      ack: () => void
    ) => {
      try {
        consola.info(`[RabbitMQ::${activityCode}] >> `, msg.routingKey)

        if (!msg?.additionalData?.['workflowId']
          || msg?.entityTypeId === EnumCrmEntityTypeId.undefined
          || (msg?.entityId || 0) < 1
        ) {
          throw new Error('Invalid request')
        }

        consola.log('start gen >> ', `/render/invoice-by-deal/${msg.entityId}/`)

        // Generate JWT token
        const token = 'empty'
        // const token = jwt.sign(
        //   {
        //     entityTypeId: msg.entityTypeId,
        //     entityId: msg.entityId,
        //     timestamp: Date.now()
        //   },
        //   process.env?.NUXT_JWT_SECRET || '?',
        //   { expiresIn: '5m' }
        // )

        const pdfBuffer = await generatePDF(
          `/render/invoice-by-deal/${msg.entityId}/`,
          { token, entityId: msg?.entityId || 0 }
        )
        consola.log('stop gen')

        // region getEmpty docx ////
        // const fileDocxPath = resolve(process.cwd(), 'server/assets/empty.docx')
        // const fileDocxBuffer = await readFile(fileDocxPath)
        // endregion ////

        let documentId = 0
        try {
          const response = await uploadDocument(
            msg.auth.clientEndpoint,
            {
              entityTypeId: msg?.entityTypeId || EnumCrmEntityTypeId.undefined,
              entityId: msg?.entityId || 0,
              title: [msg?.additionalData['code'], msg?.entityTypeId, msg?.entityId].join(':'),
              region: 'ru',
              number: Text.getUuidRfc4122(),
              refresh_token: msg.auth.refreshToken,
              auth: msg.auth.accessToken,
              pdfContent: Buffer.from(pdfBuffer).toString('base64'),
              fileContent: 'empty' // fileDocxBuffer.toString('base64')
            }
          )
          documentId = Number.parseInt(response.result?.document.id || '0')
        } catch (error) {
          consola.error('Error:', error instanceof Error ? error.message : error)
        }

        ack()
        console.log('stop send to b24 >> documentId:', documentId)
      } catch (error) {
        const problem = error instanceof Error ? error : new Error(`[RabbitMQ::${activityCode}] process error`, { cause: error })
        consola.error(problem)

        throw problem
      }
    }
  )

  consumer.consume(queueName)
}

const uploadDocument = async (_b24Url: string, params: UploadDocumentRequest): Promise<UploadDocumentResponse> => {
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
        consola.log('------------')
        consola.log('entityId', config?.data?.fields?.entityId || '?')
        consola.log('------------')

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
    console.error('<<', error)
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.message}`)
    }
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

startConsumer().catch((error) => {
  consola.error('Fatal error:', error)
  process.exit(1)
})

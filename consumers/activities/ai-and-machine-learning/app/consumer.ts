/**
 * Consumer for generate PDF from HTML
 * @todo add fail queue
 * @todo test connect - while docker up
 */
import { consola } from 'consola'
import { RabbitMQConsumer } from '@bitrix24/b24rabbitmq'
import { appOptions, rabbitMQConfig } from '../app.config'
import { SignJWT } from 'jose'
import { Text, EnumCrmEntityTypeId, B24OAuth, LoggerBrowser } from '@bitrix24/b24jssdk'
import type { B24OAuthSecret, B24OAuthParams } from '@bitrix24/b24jssdk'
import type { MessageWithAuth } from './types'
import { generatePDF } from './utils/pdf-generator'
import prisma from './utils/prisma'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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

        const pagePath = `/render/invoice-by-entity/${msg.entityTypeId}-${msg.entityId}/`
        consola.log('start gen >> ', pagePath)

        // region Check memberId ////
        const appRow = await prisma.b24App.findFirst({
          where: {
            memberId: msg.auth.memberId
          }
        })

        console.log('DB AUTH', appRow)

        if (!appRow) {
          throw new Error('Not find memberId in DB')
        }
        // endregion ////

        // region Generate JWT token ////
        // @todo add params
        const token = await new SignJWT({
            auth: msg.auth
          })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setIssuer(appOptions().appClientSecret)
          .setAudience('server-render')
          .setExpirationTime('5m')
          .sign(appOptions().jwtSecret)
        // endregion ////

        // region Generate PDF ////
        const pdfBuffer = await generatePDF(pagePath, { token })
        consola.log('stop gen')
        // endregion ////

        // region getEmpty docx ////
        const fileDocxPath = resolve(process.cwd(), 'assets/empty.docx')
        const fileDocxBuffer = await readFile(fileDocxPath)
        // endregion ////

        // region Save Result ////
        let documentId = 0

        const authOptions: B24OAuthParams = msg.auth
        const oAuthSecret: B24OAuthSecret = {
          clientId: appOptions().appClientId,
          clientSecret: appOptions().appClientSecret
        }

        const $b24 = new B24OAuth(authOptions, oAuthSecret)
        $b24.setLogger(LoggerBrowser.build('Consumer [B24]', false))
        /**
         * @todo fix work && remove
         */
        // $b24.initIsAdmin()
        // consola.info('<<', $b24.auth.isAdmin)

        const response = await $b24.callMethod(
          `crm.documentgenerator.document.upload`,
          {
            fields: {
              entityTypeId: msg?.entityTypeId || EnumCrmEntityTypeId.undefined,
              entityId: msg?.entityId || 0,
              title: [msg?.additionalData['code'], msg?.entityTypeId, msg?.entityId].join(':'),
              // @todo get from activity.params
              region: 'ru',
              number: Text.getUuidRfc4122(),
              refresh_token: msg.auth.refreshToken,
              auth: msg.auth.accessToken,
              pdfContent: Buffer.from(pdfBuffer).toString('base64'),
              fileContent: fileDocxBuffer.toString('base64')
            }
          }
        )

        documentId = Number.parseInt(response.getData().result?.document.id || '0')
        consola.log('stop send to b24 >> documentId:', documentId)
        // endregion ////
        ack()
      } catch (error) {
        const problem = error instanceof Error ? error : new Error(`[RabbitMQ::${activityCode}] process error`, { cause: error })
        consola.error(problem)

        throw problem
      }
    }
  )

  consumer.consume(queueName)
}

startConsumer().catch((error) => {
  consola.error('Fatal error:', error)
  process.exit(1)
})

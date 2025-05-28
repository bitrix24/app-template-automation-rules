/**
 * Handler event onAppUninstall
 * remove from DB member_id
 *
 * @link https://apidocs.bitrix24.com/api-reference/events/index.html#chto-bitriks24-otpravlyaet-v-obrabotchik
 * @link https://apidocs.bitrix24.com/api-reference/events/safe-event-handlers.html
 * @link https://apidocs.bitrix24.com/api-reference/common/events/on-app-uninstall.html
 */
import * as qs from 'qs-esm'
import { prisma } from '~~/utils/prisma'

interface EventOnAppUnInstallHandlerParams {
  event: string
  event_handler_id: string
  ts: string
  [key: string]: any
  auth: {
    domain: string
    client_endpoint: string
    server_endpoint: string
    member_id: string
    application_token: string
  }
}
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  /**
   * @todo fix in jsSDK
   */
  const data = qs.parse(body) as unknown as Partial<EventOnAppUnInstallHandlerParams>

  if (data.event?.toUpperCase() !== 'ONAPPUNINSTALL') {
    return createError({
      statusCode: 400,
      statusMessage: 'ERROR_EVENT_HANDLE'
    })
  }

  /**
   * We are deleting all lines for this b24.
   * If you want clarification on the applicationToken field, do it yourself
   */
  const memberId = data?.auth?.member_id || '?'

  const appRows = await prisma.b24App.deleteMany({
    where: { memberId }
  })

  console.info('----------')
  console.info(await prisma.b24App.findMany({
    where: { memberId }
  }))
  console.info('----------')
  console.info(appRows)
})

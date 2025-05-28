/**
 * Handler event onAppUninstall
 *
 * @link https://apidocs.bitrix24.com/api-reference/events/index.html#chto-bitriks24-otpravlyaet-v-obrabotchik
 * @link https://apidocs.bitrix24.com/api-reference/events/safe-event-handlers.html
 * @link https://apidocs.bitrix24.com/api-reference/common/events/on-app-uninstall.html
 *
 * @todo remove from DB by application_token
 */
import * as qs from 'qs-esm'
import type { EventOnAppUnInstallHandlerParams } from '@bitrix24/b24jssdk'
import { prisma } from '~~/utils/prisma'

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

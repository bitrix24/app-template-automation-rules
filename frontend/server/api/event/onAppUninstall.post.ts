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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = qs.parse(body)// as unknown as Partial<EventHandlerParams>

  console.info(data)
})

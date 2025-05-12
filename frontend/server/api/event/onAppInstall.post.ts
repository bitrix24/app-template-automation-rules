/**
 * Handler event onAppInstall
 *
 * @link https://apidocs.bitrix24.com/api-reference/common/events/on-app-install.html
 */
import * as qs from 'qs-esm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = qs.parse(body)// as unknown as Partial<ActivityHandlerParams>

  console.info(data)
})

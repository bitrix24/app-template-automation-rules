/**
 * Handler event onAppInstall
 *
 * @link https://apidocs.bitrix24.com/api-reference/events/index.html#chto-bitriks24-otpravlyaet-v-obrabotchik
 * @link https://apidocs.bitrix24.com/api-reference/events/safe-event-handlers.html
 * @link https://apidocs.bitrix24.com/api-reference/common/events/on-app-install.html
 */
import * as qs from 'qs-esm'
import { B24LangList, EnumAppStatus } from '@bitrix24/b24jssdk'
import type { BoolString } from '@bitrix24/b24jssdk'
import prisma from '../../utils/prisma'

/**
 * @todo remove this
 */
// {
//   event: 'ONAPPINSTALL',
//   event_handler_id: '540',
//   data: { VERSION: '1', ACTIVE: 'Y', INSTALLED: 'Y', LANGUAGE_ID: 'ru' },
//   ts: '1747023749',
//   auth: {
//     access_token: 'xxxx',
//     expires: '1747027349',
//     expires_in: '3600',
//     scope: 'crm,catalog,bizproc,placement,user_brief',
//     domain: 'xx.bitrix24.ru',
//     server_endpoint: 'https://oauth.bitrix.info/rest/',
//     status: 'L',
//     client_endpoint: 'https://xx.bitrix24.ru/rest/',
//     member_id: 'xxx',
//     user_id: '1',
//     refresh_token: 'xxx',
//     application_token: 'xxxx'
//   }
// }

/**
 * @todo fix by @b24
 */
interface HandlerAuthParams {
  access_token: string
  expires: string
  expires_in: string
  scope: string
  domain: string
  server_endpoint: string
  status: string
  client_endpoint: string
  member_id: string
  user_id: string
  refresh_token: string
  application_token: string
}

/**
 * @todo fix by @b24
 */
interface EventHandlerParams {
  event: string
  event_handler_id: string
  ts: string
  auth?: HandlerAuthParams
}
/**
 * @todo fix by @b24
 */
interface EventOnAppInstallHandlerParams extends EventHandlerParams {
  data: {
    VERSION: string
    ACTIVE: BoolString
    INSTALLED: BoolString
    LANGUAGE_ID: B24LangList
  }
  auth: HandlerAuthParams
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = qs.parse(body) as unknown as Partial<EventOnAppInstallHandlerParams>

  if (data.event?.toUpperCase() !== 'ONAPPINSTALL') {
    return createError({
      statusCode: 400,
      statusMessage: 'ERROR_EVENT_HANDLE'
    })
  }

  const memberId = data?.auth?.member_id || '?'
  const userId = Number.parseInt(data?.auth?.user_id || '0')

  const appRow = await prisma.b24App.findFirst({
    where: {
      memberId,
      userId
    }
  })

  if (appRow) {
    console.info('FIND / update', appRow.id)
    await prisma.b24App.update({
      where: {
        id: appRow.id
      },
      data: {
        memberId: data?.auth?.member_id || '?',
        version: data.data?.VERSION || '?',
        languageId: data.data?.LANGUAGE_ID || B24LangList.en,
        applicationToken: data?.auth?.application_token || '?',
        userId: Number.parseInt(data?.auth?.user_id || '0'),
        accessToken: data?.auth?.access_token || '?',
        refreshToken: data?.auth?.refresh_token || '?',
        expires: Number.parseInt(data?.auth?.expires || '0'),
        expiresIn: Number.parseInt(data?.auth?.expires_in || '3600'),
        scope: data?.auth?.scope || '',
        domain: data?.auth?.domain || '',
        clientEndpoint: data?.auth?.client_endpoint || '?',
        serverEndpoint: data?.auth?.server_endpoint || '?',
        status: data?.auth?.status || EnumAppStatus.Free
      }
    })
  } else {
    console.info('NEW')
    await prisma.b24App.create({
      data: {
        memberId: data?.auth?.member_id || '?',
        version: data.data?.VERSION || '?',
        languageId: data.data?.LANGUAGE_ID || B24LangList.en,
        applicationToken: data?.auth?.application_token || '?',
        userId: Number.parseInt(data?.auth?.user_id || '0'),
        accessToken: data?.auth?.access_token || '?',
        refreshToken: data?.auth?.refresh_token || '?',
        expires: Number.parseInt(data?.auth?.expires || '0'),
        expiresIn: Number.parseInt(data?.auth?.expires_in || '3600'),
        scope: data?.auth?.scope || '',
        domain: data?.auth?.domain || '',
        clientEndpoint: data?.auth?.client_endpoint || '?',
        serverEndpoint: data?.auth?.server_endpoint || '?',
        status: data?.auth?.status || EnumAppStatus.Free
      }
    })
  }
  console.info('----------')
  const list = await prisma.b24App.findMany()
  console.info('----------', list)
})

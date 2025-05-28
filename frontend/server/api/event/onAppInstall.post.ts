/**
 * Handler event onAppInstall
 *
 * @link https://apidocs.bitrix24.com/api-reference/events/index.html#chto-bitriks24-otpravlyaet-v-obrabotchik
 * @link https://apidocs.bitrix24.com/api-reference/events/safe-event-handlers.html
 * @link https://apidocs.bitrix24.com/api-reference/common/events/on-app-install.html
 */
import * as qs from 'qs-esm'
import { B24LangList, EnumAppStatus } from '@bitrix24/b24jssdk'
import type { EventOnAppInstallHandlerParams } from '@bitrix24/b24jssdk'
import { prisma } from '~~/utils/prisma'

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
      userId,
      isFromAppInstall: true
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
        status: data?.auth?.status || EnumAppStatus.Free,
        isFromAppInstall: true
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
        status: data?.auth?.status || EnumAppStatus.Free,
        isFromAppInstall: true
      }
    })
  }
  console.info('----------')
  console.info(await prisma.b24App.findMany())
  console.info('----------')
})

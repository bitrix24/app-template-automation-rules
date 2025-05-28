import { jwtVerify } from 'jose'
import { EnumCrmEntityTypeId, omit, getEnumValue } from '@bitrix24/b24jssdk'
import type { B24OAuthParams } from '@bitrix24/b24jssdk'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.server) {
    return
  }

  const requestDataServerRender = useRequestDataServerRender()
  const event = useRequestEvent()
  const config = useRuntimeConfig()

  try {
    // region Check Request ////
    if (typeof event === 'undefined') throw new Error('Invalid request')

    const entityId = Number.parseInt((Array.isArray(to.params.entityId) ? to.params.entityId[0] : to.params.entityId) || '0')
    const entityTypeId = getEnumValue(
      EnumCrmEntityTypeId,
      Number.parseInt((Array.isArray(to.params.entityTypeId) ? to.params.entityTypeId[0] : to.params.entityTypeId) || '0')
    ) || EnumCrmEntityTypeId.undefined

    if (
      !entityId
      || ![
        EnumCrmEntityTypeId.lead,
        EnumCrmEntityTypeId.deal,
        EnumCrmEntityTypeId.invoice,
        EnumCrmEntityTypeId.quote
      ].includes(entityTypeId)
    ) {
      throw new Error('Invalid request')
    }

    const authHeader = event.node.req.headers['authorization'] || ''
    const token = authHeader.replace('Bearer ', '')

    if (token.length < 1) throw new Error('Empty token')

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(config.jwtSecret)
    )

    if (payload.iss !== config.appClientSecret) throw new Error('Invalid token.iss')
    if (payload.aud !== 'server-render') throw new Error('Invalid token.aud')
    if (!payload.auth) throw new Error('Empty token.auth')
    // endregion ////

    requestDataServerRender.value.auth = payload.auth as B24OAuthParams
    requestDataServerRender.value.entityId = entityId
    requestDataServerRender.value.entityTypeId = entityTypeId
    requestDataServerRender.value.payload = omit(payload as Record<string, any>, ['auth', 'iat', 'iss', 'aud', 'exp'])
  } catch (error) {
    requestDataServerRender.value.auth = null
    requestDataServerRender.value.entityId = 0
    requestDataServerRender.value.entityTypeId = EnumCrmEntityTypeId.undefined
    requestDataServerRender.value.payload = undefined
    throw createError({
      statusCode: 401,
      statusMessage: import.meta.dev
        ? error instanceof Error ? error.message : 'Not Found'
        : 'Invalid request!',
      data: {
        description: import.meta.dev
          ? 'Problem in middleware/auth-server-render'
          : undefined,
        homePageIsHide: true
      },
      cause: error,
      fatal: true
    })
  }
})

import { jwtVerify } from 'jose'
import { EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import type { B24OAuthParams } from '@bitrix24/b24jssdk'

// region TMP /////
/**
 * @todo fix by @b24
 */
function getEnumValue<T extends Record<string, string | number>>(
  enumObj: T,
  value: string | number
): T[keyof T] | undefined {
  return (Object.values(enumObj) as (string | number)[]).includes(value)
    ? value as T[keyof T]
    : undefined
}
// endregion ////

const requestDataForRender = useState(
  'request-data-for-render',
  (): {
    auth: null | B24OAuthParams
    entityId: number
    entityTypeId: EnumCrmEntityTypeId
  } => ({
    auth: null,
    entityId: 0,
    entityTypeId: 0
  })
)

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.server) {
    return
  }
  const event = useRequestEvent()
  const config = useRuntimeConfig()

  try {
    if (typeof event === 'undefined') throw new Error('Invalid request')

    const authHeader = event.node.req.headers['authorization'] || ''
    const token = authHeader.replace('Bearer ', '')

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(config.jwtSecret)
    )

    if (payload.iss !== config.appClientSecret) throw new Error('Invalid request')
    if (payload.aud !== 'render-invoice-by-entity') throw new Error('Invalid request')

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

    requestDataForRender.value.entityId = entityId
    requestDataForRender.value.entityTypeId = entityTypeId
    requestDataForRender.value.auth = payload?.auth
  } catch (error) {
    throw createError({
      statusCode: 401,
      // statusMessage: error instanceof Error ? error.message : 'Not Found',
      statusMessage: 'Not Found!',
      data: {
        description: 'Problem in middleware/render-invoice-by-entity-server',
        homePageIsHide: true
      },
      cause: error,
      fatal: true
    })
  }
})

import { EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import type { B24OAuthParams } from '@bitrix24/b24jssdk'

const requestDataServerRenderState = useState<{
  auth: null | B24OAuthParams
  entityId: number
  entityTypeId: EnumCrmEntityTypeId
  payload?: Record<string, any>
}>(
  'requestDataServerRender',
  () => ({
    auth: null,
    entityId: 0,
    entityTypeId: EnumCrmEntityTypeId.undefined
  })
)

export const useRequestDataServerRender = () => requestDataServerRenderState

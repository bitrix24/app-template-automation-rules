import { LoggerBrowser, B24Hook, EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import type { Deal, ProductRow } from '~/types/bitrix'

export const $logger = LoggerBrowser.build(
  'useB24 ',
  import.meta.env?.DEV === true
)

let $b24: null | B24Hook = null

export const useB24 = (): B24Hook => {
  if ($b24) {
    return $b24
  }

  const config = useRuntimeConfig()
  $b24 = new B24Hook({
    b24Url: config.b24HookUrl,
    userId: config.b24HookUserId,
    secret: config.b24HookSecret
  })

  $b24.setLogger(LoggerBrowser.build('Core', false))

  return $b24
}

export const useFetchDeal = (dealId: number) => {
  return useAsyncData(
    `deal-${dealId}`,
    async () => {
      let entity: Deal = {
        id: 0,
        title: '',
        companyId: 0,
        contactId: 0
      }

      const response = await useB24().callBatch({
        entityItem: {
          method: 'crm.item.get',
          params: {
            entityTypeId: EnumCrmEntityTypeId.deal,
            id: dealId,
            select: [
              'id',
              'title',
              'companyId',
              'contactId'
            ]
          }
        },
        entityCompanyItem: {
          method: 'crm.item.list',
          params: {
            entityTypeId: EnumCrmEntityTypeId.company,
            filter: {
              id: '$result[entityItem][item][companyId]'
            },
            select: [
              'id',
              'title'
            ]
          }
        },
        entityContactItem: {
          method: 'crm.item.list',
          params: {
            entityTypeId: EnumCrmEntityTypeId.contact,
            filter: {
              id: '$result[entityItem][item][contactId]'
            },
            select: [
              'id',
              'lastName',
              'name',
              'secondName'
            ]
          }
        }
      })

      const data = response.getData()

      entity = Object.assign(
        entity,
        data.entityItem.item || {}
      )

      if (
        data?.entityCompanyItem?.items
        && data.entityCompanyItem.items.length > 0
      ) {
        entity.company = data.entityCompanyItem.items[0]
      }

      if (
        data?.entityContactItem?.items
        && data.entityContactItem.items.length > 0
      ) {
        entity.contact = data.entityContactItem.items[0]
        if (entity.contact) {
          entity.contact.title = [
            entity.contact?.lastName,
            entity.contact?.name,
            entity.contact?.secondName
          ].filter(Boolean).join(' ')
        }
      }

      entity.products = []
      const generator = useB24().fetchListMethod(
        'crm.item.productrow.list',
        {
          filter: {
            /**
             * @todo use const from EnumCrmEntityTypeId
             */
            '=ownerType': 'D',
            '=ownerId': entity.id
          }
        },
        'id',
        'productRows'
      )

      for await (const rows of generator) {
        for (const row of rows) {
          entity.products.push(row as ProductRow)
        }
      }

      return entity
    }
  )
}

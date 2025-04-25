import { LoggerBrowser, B24Hook, EnumCrmEntityTypeId } from '@bitrix24/b24jssdk'
import type { Deal, ProductImage, ProductInfo, ProductRow } from '~/types/bitrix'

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

      let catalogId: number[] = []

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
        },
        catalogCatalogList: {
          method: 'catalog.catalog.list',
          params: {
            select: [
              'iblockId',
              'iblockTypeId',
              'id',
              'lid',
              'name',
              'productIblockId',
              'skuPropertyId'
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

      if (
        data?.catalogCatalogList?.catalogs
        && data.catalogCatalogList.catalogs.length > 0
      ) {
        catalogId = data.catalogCatalogList.catalogs.map((row: { iblockId: number }) => {
          return row.iblockId
        })
      }

      /**
       * @todo make sort
       */
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

      const listProductsId: number[] = []
      for await (const rows of generator) {
        for (const row of rows as ProductRow[]) {
          entity.products.push(row)
          listProductsId.push(row.productId)
        }
      }

      if (listProductsId.length < 1) {
        return entity
      }

      const generatorProducts = useB24().fetchListMethod(
        'catalog.product.list',
        {
          filter: {
            '@id': listProductsId,
            'iblockId': catalogId
          },
          select: [
            'id', 'iblockId',
            'name', 'active',
            'previewText', 'detailText',
            'weight', 'height', 'length', 'width'
          ]
        },
        'id',
        'products'
      )

      const commandList = []

      for await (const rows of generatorProducts) {
        for (const row of rows as ProductInfo[]) {
          commandList.push({
            method: 'catalog.productImage.list',
            params: {
              productId: row.id,
              select: [
                'id',
                'name',
                'productId',
                'type',
                'detailUrl'
              ]
            }
          })
          /**
           * @memo we can get some eq productId in different productRow
           */
          entity.products.forEach((product) => {
            if (product.productId !== row.id) {
              return
            }

            product.productInfo = row
          })
        }
      }

      if (commandList.length < 1) {
        return entity
      }

      const responseCatalogImages = await useB24().callBatchByChunk(
        commandList,
        false
      )

      for (const chunk of responseCatalogImages.getData()) {
        for (const row of chunk?.productImages as ProductImage[]) {
          /**
           * @memo we can get some eq productId in different productRow
           */
          entity.products.forEach((product) => {
            if (product.productId !== row.productId) {
              return
            }

            product.productImage = product.productImage || []
            product.productImage.push(row)
          })
        }
      }

      return entity
    }
  )
}

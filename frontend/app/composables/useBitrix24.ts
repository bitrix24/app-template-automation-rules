import { LoggerBrowser, B24Hook, useB24Helper, B24LangList, LoadDataType, EnumCrmEntityTypeId, EnumCrmEntityTypeShort, useFormatter } from '@bitrix24/b24jssdk'
import type { Deal, ProductInfo, ProductRow } from '~/types/bitrix'
import type { CatalogProductImage } from '@bitrix24/b24jssdk'

export const $logger = LoggerBrowser.build(
  'useB24 ',
  import.meta.env?.DEV === true
)

let $b24: null | B24Hook = null

const {
  getB24Helper,
  isInitB24Helper,
  initB24Helper
} = useB24Helper()

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

/**
 * @todo get from activity.params
 */
export const useCurrentLang = (): typeof B24LangList[keyof typeof B24LangList] => {
  return B24LangList.en
}

const { formatterNumber } = useFormatter()
formatterNumber.setDefLocale(useCurrentLang())

export const useFormatterNumber = (): typeof formatterNumber => {
  return formatterNumber
}

export const useB24HelperManager = async () => {
  if (isInitB24Helper()) {
    return getB24Helper()
  }
  const $b24 = useB24()
  await initB24Helper(
    $b24,
    [
      LoadDataType.Profile,
      LoadDataType.Currency
    ]
  )

  return getB24Helper()
}

/**
 * @todo test under not admin use !!
 */
export const useFetchEntity = (entityTypeId: EnumCrmEntityTypeId, entityId: number) => {
  return useAsyncData(
    `${entityTypeId}-${entityId}`,
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
            entityTypeId: entityTypeId,
            id: entityId,
            select: [
              'id',
              'title',
              'companyId',
              'contactId'
            ]
          }
        },
        entityItemPaymentList: {
          method: 'crm.item.payment.list',
          params: {
            entityTypeId: entityTypeId,
            entityId: entityId
          }
        },
        entityItemDeliveryList: {
          method: 'crm.item.delivery.list',
          params: {
            entityTypeId: entityTypeId,
            entityId: entityId
          }
        },
        entityCompanyItem: {
          method: 'crm.item.get',
          params: {
            entityTypeId: EnumCrmEntityTypeId.company,
            id: '$result[entityItem][item][companyId]'
          }
        },
        entityContactItem: {
          method: 'crm.item.get',
          params: {
            entityTypeId: EnumCrmEntityTypeId.contact,
            id: '$result[entityItem][item][contactId]'
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
      }, false)

      const data = response.getData()

      entity = Object.assign(
        entity,
        data.entityItem.item || {}
      )

      if (
        data?.entityCompanyItem?.item
        && data.entityCompanyItem.item?.id
      ) {
        entity.company = data.entityCompanyItem.item
      }

      if (
        data?.entityContactItem?.item
        && data.entityContactItem.item?.id
      ) {
        entity.contact = data.entityContactItem.item
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

      if (
        data?.entityItemPaymentList
        && data.entityItemPaymentList.length > 0
      ) {
        entity.paymentList = data.entityItemPaymentList
      }

      if (
        data?.entityItemDeliveryList
        && data.entityItemDeliveryList.length > 0
      ) {
        entity.deliveryList = data.entityItemDeliveryList
      }

      /**
       * @todo not move to batch -> may be more > 50
       */
      entity.products = []
      const generator = useB24().fetchListMethod(
        'crm.item.productrow.list',
        {
          filter: {
            '=ownerType': EnumCrmEntityTypeShort.deal,
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

      entity.products.sort((a, b) => a.sort - b.sort)

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
        for (const row of chunk?.productImages as CatalogProductImage[]) {
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

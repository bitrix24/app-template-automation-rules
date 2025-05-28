import { EnumCrmEntityTypeId, getEnumCrmEntityTypeShort, omit } from '@bitrix24/b24jssdk'
import type { CatalogProductImage, B24OAuth } from '@bitrix24/b24jssdk'
import type { EntityForRender, ProductInfo, ProductRow } from '~/types/bitrix'
import QRCode from 'qrcode'

export const useFetchEntity = (
  $b24: B24OAuth,
  entityTypeId: EnumCrmEntityTypeId,
  entityId: number
) => {
  return useAsyncData(
    `${entityTypeId}-${entityId}`,
    async () => {
      let entity: EntityForRender = {
        id: 0,
        title: '',
        companyId: 0,
        contactId: 0,
        qrCode: null
      }

      let catalogId: number[] = []

      const customFieldsForLead = ['lastName', 'name', 'secondName', 'companyTitle', 'phone', 'email']
      const response = await $b24.callBatch({
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
            ].concat(
              entityTypeId === EnumCrmEntityTypeId.lead
                ? customFieldsForLead
                : []
            )
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
        omit(data.entityItem.item || {}, customFieldsForLead)
      )

      entity.qrCode = QRCode.toDataURL(
        `${$b24.getTargetOrigin()}crm/type/${entityTypeId}/details/${entity.id}/?any=app-qrCode`,
        {
          errorCorrectionLevel: 'H',
          margin: 0
        }
      )

      if (
        data?.entityCompanyItem?.item
        && data.entityCompanyItem.item?.id
      ) {
        entity.company = data.entityCompanyItem.item
      } else if (
        entityTypeId === EnumCrmEntityTypeId.lead
        && (data?.entityItem?.item?.companyTitle || '').length > 0
      ) {
        entity.company = {
          id: 0,
          title: data?.entityItem?.item?.companyTitle,
          phone: data?.entityItem?.item?.phone,
          email: data?.entityItem?.item?.email
        }
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
      } else if (
        entityTypeId === EnumCrmEntityTypeId.lead
        && (
          (data?.entityItem?.item?.lastName || '').length > 0
          || (data?.entityItem?.item?.name || '').length > 0
          || (data?.entityItem?.item?.secondName || '').length > 0
        )
      ) {
        entity.contact = {
          id: 0,
          title: [
            data?.entityItem?.item?.lastName || '',
            data?.entityItem?.item?.name || '',
            data?.entityItem?.item?.secondName || ''
          ].filter(Boolean).join(' '),
          lastName: data?.entityItem?.item?.lastName,
          name: data?.entityItem?.item?.name,
          secondName: data?.entityItem?.item?.secondName,
          phone: data?.entityItem?.item?.phone,
          email: data?.entityItem?.item?.email
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
       * @memo Not move to batch -> may be more > 50
       */
      entity.products = []
      const generator = $b24.fetchListMethod(
        'crm.item.productrow.list',
        {
          filter: {
            '=ownerType': getEnumCrmEntityTypeShort(entityTypeId),
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

      const generatorProducts = $b24.fetchListMethod(
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

      const responseCatalogImages = await $b24.callBatchByChunk(
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
    },
    { server: true }
  )
}

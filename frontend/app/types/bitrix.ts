import type { CrmItemProductRow, CatalogProduct, CatalogProductSku, CatalogProductOffer, CatalogProductService, CatalogProductImage, CrmItemDelivery, CrmItemPayment } from '@bitrix24/b24jssdk'

export type BatchCommands = {
  [key: string]: string | {
    method: string
    params?: Record<string, any>
  }
}

export type BitrixBatchResponse<T extends Record<string, any>> = {
  result: {
    [K in keyof T]: {
      result: T[K]
      time: number
      error?: string
    }
  }
}

export type ProductInfo = CatalogProduct | CatalogProductSku | CatalogProductOffer | CatalogProductService

export type ProductRow = CrmItemProductRow & {
  productInfo?: ProductInfo
  productImage?: CatalogProductImage[]
}

export type Entity = {
  id: number
  title: string
  [key: string]: any
}

export type Company = Entity & {
  phone?: string
  email?: string
}

export type Contact = Entity & {
  lastName?: string
  name?: string
  secondName?: string
  phone?: string
  email?: string
}

export type EntityForRender = Entity & {
  opportunity?: number
  currencyId?: string
  companyId: number
  company?: Company
  contactId: number
  contact?: Contact
  products?: ProductRow[]
  paymentList?: CrmItemPayment[]
  deliveryList?: CrmItemDelivery[]
}

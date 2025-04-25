import type { BoolString } from '@bitrix24/b24jssdk'

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

export type ProductImage = {
  id: number
  name: string
  productId: number
  type: 'DETAIL_PICTURE' | 'PREVIEW_PICTURE' | 'MORE_PHOTO'
  downloadUrl?: string
  detailUrl?: string
}

export type ProductInfo = {
  id: number
  active: BoolString
  iblockId: number
  name: string
  previewText?: string
  previewTextType?: 'text' | 'html'
  detailText?: string
  detailTextType?: 'text' | 'html'
  weight?: number
  height?: number
  length?: number
  width?: number
}

export type ProductRow = {
  id: number
  xmlId: string
  productId: number
  productName: string
  type: number
  price: number
  quantity: number
  measureName: string
  storeId: number
  productInfo?: ProductInfo
  productImage?: ProductImage[]
}

export type Entity = {
  id: number
  title: string
}

export type Company = Entity & {}

export type Contact = Entity & {
  lastName?: string
  name?: string
  secondName?: string
}

export type Deal = Entity & {
  companyId: number
  company?: Company
  contactId: number
  contact?: Contact
  products?: ProductRow[]
}

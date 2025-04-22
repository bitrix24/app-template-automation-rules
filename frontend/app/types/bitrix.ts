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

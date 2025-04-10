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

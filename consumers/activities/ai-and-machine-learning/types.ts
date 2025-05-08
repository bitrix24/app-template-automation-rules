import type { Message } from '@bitrix24/b24rabbitmq'
import type { B24OAuthParams } from '@bitrix24/b24jssdk'

/**
 * @todo move to jsSdk
 */
export interface UploadDocumentResponse {
  result?: {
    document: {
      id: string
      pdfUrl: string
      downloadUrlMachine: string
      downloadUrl: string
      pdfUrlMachine: string
      publicUrl?: string
      emailDiskFile: string
      number: string
      title: string
    }
  }
  error?: string
}

/**
 * @todo move to jsSdk
 */
export interface UploadDocumentRequest {
  entityTypeId: number
  entityId: number
  title: string
  region: string
  number: string
  fileContent: string
  pdfContent?: string
  imageContent?: string
  auth: string
  refresh_token: string
}

export interface MessageWithAuth extends Message {
  auth: B24OAuthParams
}

export type ItemStatus = 'queued' | 'converting' | 'done' | 'error'

export interface QueueItem {
  id: string
  file: File
  previewUrl: string
  sourceLabel: string
  originalSize: number
  status: ItemStatus
  error?: string
  result?: {
    blob: Blob
    url: string
    filename: string
    size: number
    width: number
    height: number
  }
}

export interface BaseModel {
  id: string
  createdAt: string
  createdBy: string
  updatedAt?: string
  updatedBy?: string
  deletedAt?: string
  deletedBy?: string
  version: number
}
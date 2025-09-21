// Storage adapter abstraction for optional remote or advanced stores
export interface StorageAdapter {
  // Save a blob and return an id
  saveBlob?: (id: string, blob: Blob | File, mimeType?: string) => Promise<string>

  // Retrieve a blob by id
  getBlob?: (id: string) => Promise<Blob | undefined>

  // Remove a blob
  deleteBlob?: (id: string) => Promise<void>

  // Optional: upload file and return remote url
  uploadFile?: (file: File) => Promise<string>
}

class DisabledStorageAdapter implements StorageAdapter {
  async saveBlob(_id: string, _blob: Blob | File, _mimeType?: string): Promise<string> {
    return Promise.reject(new Error('Storage adapter disabled'))
  }

  async getBlob(_id: string): Promise<Blob | undefined> {
    return undefined
  }

  async deleteBlob(_id: string): Promise<void> {
    return
  }

  async uploadFile(_file: File): Promise<string> {
    return Promise.reject(new Error('Storage adapter disabled'))
  }
}

let adapter: StorageAdapter = new DisabledStorageAdapter()

export function registerStorageAdapter(a: StorageAdapter) {
  adapter = a
}

export function getStorageAdapter(): StorageAdapter {
  return adapter
}

export default { registerStorageAdapter, getStorageAdapter }

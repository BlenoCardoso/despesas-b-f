const storeMap = new Map<string, Blob | File>()

export const blobStorage = {
  async store(ref: string, data: Blob | File) {
    storeMap.set(ref, data)
    return Promise.resolve()
  },
  async get(ref: string) {
    return storeMap.get(ref)
  },
  async delete(ref: string) {
    storeMap.delete(ref)
    return Promise.resolve()
  }
}

export default blobStorage

export function hasAttachment(doc: any): boolean {
  if (!doc) return false
  return ('blobRef' in doc) || ('fileName' in doc) || ('mimeType' in doc)
}

export function hasFileFilter(filter: any): boolean {
  if (!filter) return false
  return !!(filter.mimeTypes || filter.sizeMin !== undefined || filter.sizeMax !== undefined)
}

export function hasFileStats(doc: any): boolean {
  return hasAttachment(doc) && typeof doc.fileSize === 'number'
}

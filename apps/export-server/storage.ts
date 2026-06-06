import fs from 'fs'
import path from 'path'
import type { StorageProvider } from '@motionslides/shared'

export function getStorageDir(): string {
  if (process.env.STORAGE_DIR) {
    return path.resolve(process.env.STORAGE_DIR)
  }
  const cwd = process.cwd()
  const normalized = cwd.replace(/\\/g, '/')
  let root = cwd
  if (normalized.includes('/apps/web')) {
    root = normalized.split('/apps/web')[0]
  } else if (normalized.includes('/apps/export-server')) {
    root = normalized.split('/apps/export-server')[0]
  }
  return path.resolve(root, '.storage')
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string

  constructor() {
    this.baseDir = getStorageDir()
    fs.mkdirSync(this.baseDir, { recursive: true })
  }

  async uploadFile(data: Uint8Array, filename: string, mimeType: string): Promise<{ url: string; key: string }> {
    const category = mimeType.startsWith('audio/') ? 'uploads' : 'exports'
    const targetDir = path.join(this.baseDir, category)
    fs.mkdirSync(targetDir, { recursive: true })

    const isExport = category === 'exports'
    const baseName = path.basename(filename)
    const safeName = isExport ? baseName : `${Date.now()}-${baseName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(targetDir, safeName)
    
    // Path traversal check
    const resolvedPath = path.resolve(filePath)
    const resolvedTargetDir = path.resolve(targetDir)
    if (!resolvedPath.startsWith(resolvedTargetDir + path.sep)) {
      throw new Error('Security Error: Invalid filename path traversal')
    }

    await fs.promises.writeFile(filePath, Buffer.from(data))
    
    const key = `${category}/${safeName}`
    const url = isExport ? `/api/download/${safeName.split('.')[0]}` : `/api/uploads/${safeName}`
    return { url, key }
  }

  async getDownloadUrl(key: string): Promise<string> {
    const parts = key.split('/')
    const category = parts[0]
    const filename = parts.slice(1).join('/')
    if (category === 'exports') {
      return `/api/download/${filename.split('.')[0]}`
    }
    return `/api/uploads/${filename}`
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key)
    const resolvedPath = path.resolve(filePath)
    const resolvedBaseDir = path.resolve(this.baseDir)
    if (!resolvedPath.startsWith(resolvedBaseDir + path.sep)) {
      throw new Error('Security Error: Access Denied')
    }
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  }

  getFilePath(key: string): string {
    const filePath = path.join(this.baseDir, key)
    const resolvedPath = path.resolve(filePath)
    const resolvedBaseDir = path.resolve(this.baseDir)
    if (!resolvedPath.startsWith(resolvedBaseDir + path.sep)) {
      throw new Error('Security Error: Access Denied')
    }
    return filePath
  }
}

class S3StorageProvider implements StorageProvider {
  async uploadFile(data: Uint8Array, filename: string, mimeType: string): Promise<{ url: string; key: string }> {
    throw new Error('S3 Upload not configured')
  }
  async getDownloadUrl(key: string): Promise<string> {
    throw new Error('S3 Download not configured')
  }
  async deleteFile(key: string): Promise<void> {
    throw new Error('S3 Delete not configured')
  }
}

export const storageProvider: StorageProvider = 
  process.env.STORAGE_PROVIDER === 's3' 
    ? new S3StorageProvider() 
    : new LocalStorageProvider()

export function getStorageProvider(): StorageProvider & { getFilePath?(key: string): string } {
  return storageProvider
}

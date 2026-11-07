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

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string
  private publicUrlPrefix?: string

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'motionslides-exports'
    this.publicUrlPrefix = process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL

    const endpoint = process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : (process.env.S3_ENDPOINT || undefined)

    const region = process.env.S3_REGION || 'auto'
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  async uploadFile(data: Uint8Array, filename: string, mimeType: string): Promise<{ url: string; key: string }> {
    const category = mimeType.startsWith('audio/') ? 'uploads' : 'exports'
    const baseName = path.basename(filename)
    const key = `${category}/${Date.now()}-${baseName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(data),
        ContentType: mimeType,
      })
    )

    const url = await this.getDownloadUrl(key)
    return { url, key }
  }

  async getDownloadUrl(key: string): Promise<string> {
    if (this.publicUrlPrefix) {
      return `${this.publicUrlPrefix.replace(/\/$/, '')}/${key}`
    }

    // Default: generate a presigned GET URL valid for 24 hours (86,400 seconds)
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    return await getSignedUrl(this.client, command, { expiresIn: 86400 })
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }
}

export const storageProvider: StorageProvider = 
  process.env.STORAGE_PROVIDER === 's3' || process.env.STORAGE_PROVIDER === 'r2'
    ? new S3StorageProvider() 
    : new LocalStorageProvider()

export function getStorageProvider(): StorageProvider & { getFilePath?(key: string): string } {
  return storageProvider
}

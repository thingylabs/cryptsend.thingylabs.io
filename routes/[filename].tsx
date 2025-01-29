// routes/[filename].tsx
import { Handlers } from '$fresh/server.ts'
import { checkQuota, updateQuotas } from '../utils/quotas.ts'
import { recordDeletion, recordDownload, recordUpload } from '../utils/stats.ts'

const MAX_FILE_SIZE = parseInt(Deno.env.get('MAX_FILE_SIZE') || '10485760') // 10MB default
const kv = await Deno.openKv()

interface FileData {
  content: Uint8Array
  size: number
  created: string
  deletionKey: string
}

async function storeFileData(key: string, data: FileData) {
  await kv.set(['files', key], data)
}

async function getFileData(key: string): Promise<FileData | null> {
  const res = await kv.get<FileData>(['files', key])
  return res.value
}

async function deleteFileData(key: string) {
  await kv.delete(['files', key])
}

export const handler: Handlers = {
  async PUT(req, ctx) {
    try {
      const key = ctx.params.filename // This is our storage key

      const size = req.headers.get('content-length')
      if (!size || parseInt(size) > MAX_FILE_SIZE) {
        return new Response(
          `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          { status: 413 }
        )
      }

      const fileSize = parseInt(size)
      const quotaOk = await checkQuota(fileSize)
      if (!quotaOk) {
        return new Response(
          'Service quota exceeded (storage or transfer limit reached)',
          { status: 507 }
        )
      }

      // Read the request body
      const arrayBuffer = await req.arrayBuffer()
      const fileData = new Uint8Array(arrayBuffer)

      // Extract IV from the request - it's added to the key for deletion auth
      const iv = key.slice(64, 96)
      const deletionKey = key + iv // Full key+iv for deletion auth

      // Store file data and metadata in KV
      await storeFileData(key, {
        content: fileData,
        size: fileSize,
        created: new Date().toISOString(),
        deletionKey
      })

      await updateQuotas(fileSize, true)
      await recordUpload(fileSize)

      // Auto-deletion after 24h
      setTimeout(async () => {
        try {
          const fileInfo = await getFileData(key)
          if (fileInfo) {
            await recordDeletion(fileInfo.size)
            await deleteFileData(key)
          }
        } catch {
          // Ignore deletion errors
        }
      }, 24 * 60 * 60 * 1000)

      return new Response('OK', { status: 200 })
    } catch (err) {
      console.error('Upload error:', err)
      return new Response('Upload failed', { status: 500 })
    }
  },

  async GET(_req, ctx) {
    try {
      const key = ctx.params.filename
      const fileData = await getFileData(key)
      
      if (!fileData) {
        return new Response('File not found', { status: 404 })
      }

      await recordDownload(fileData.size)

      // Create a ReadableStream from the file content
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(fileData.content)
          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'content-type': 'application/octet-stream',
          'cache-control': 'no-store',
          'content-length': fileData.size.toString()
        }
      })
    } catch (err) {
      console.error('Download error:', err)
      return new Response('Download failed', { status: 500 })
    }
  },

  async DELETE(req, ctx) {
    try {
      const key = ctx.params.filename

      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response('Authorization required', { status: 401 })
      }
      const deletionKey = authHeader.slice(7)

      const fileData = await getFileData(key)
      if (!fileData) {
        return new Response('File not found', { status: 404 })
      }

      if (fileData.deletionKey !== deletionKey) {
        return new Response('Invalid authorization', { status: 403 })
      }

      await recordDeletion(fileData.size)
      await deleteFileData(key)

      return new Response('File deleted', { status: 200 })
    } catch (err) {
      console.error('Delete error:', err)
      return new Response('Delete failed', { status: 500 })
    }
  }
}
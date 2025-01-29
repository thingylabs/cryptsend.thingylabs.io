// routes/[filename].tsx
import { Handlers } from '$fresh/server.ts'
import { checkQuota, updateQuotas } from '../utils/quotas.ts'
import { recordDeletion, recordDownload, recordUpload } from '../utils/stats.ts'

const MAX_FILE_SIZE = parseInt(Deno.env.get('MAX_FILE_SIZE') || '10485760') // 10MB default
const FILENAME = 'only_you_know'

// Initialize KV store
const kv = await Deno.openKv()

interface FileData {
  content: Uint8Array
  size: number
  created: string
  deletionKey: string
}

async function storeFileData(hash: string, data: FileData) {
  await kv.set(['files', hash], data)
}

async function getFileData(hash: string): Promise<FileData | null> {
  const res = await kv.get<FileData>(['files', hash])
  return res.value
}

async function deleteFileData(hash: string) {
  await kv.delete(['files', hash])
}

export const handler: Handlers = {
  async PUT(req, ctx) {
    try {
      const filename = ctx.params.filename

      if (!filename.endsWith('.enc')) {
        return new Response('Only encrypted files (.enc) are accepted', {
          status: 400,
        })
      }

      const size = req.headers.get('content-length')
      if (!size || parseInt(size) > MAX_FILE_SIZE) {
        return new Response(
          `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          {
            status: 413,
          },
        )
      }

      const fileSize = parseInt(size)
      const quotaOk = await checkQuota(fileSize)
      if (!quotaOk) {
        return new Response(
          'Service quota exceeded (storage or transfer limit reached)',
          {
            status: 507,
          },
        )
      }

      // Read the request body
      const arrayBuffer = await req.arrayBuffer()
      const fileData = new Uint8Array(arrayBuffer)

      // Calculate SHA-256 hash of the file content
      const hash = await crypto.subtle.digest('SHA-256', fileData)
      const hashHex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      // Extract key and IV from the filename
      const authKey = filename.slice(-64 - 32 - 4, -4) // 64 for key, 32 for iv, 4 for .enc

      // Store file data and metadata in KV
      await storeFileData(hashHex, {
        content: fileData,
        size: fileSize,
        created: new Date().toISOString(),
        deletionKey: authKey,
      })

      await updateQuotas(fileSize, true)
      await recordUpload(fileSize)

      // Auto-deletion after 24h
      setTimeout(async () => {
        try {
          const fileInfo = await getFileData(hashHex)
          if (fileInfo) {
            await recordDeletion(fileInfo.size)
            await deleteFileData(hashHex)
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
      const filename = ctx.params.filename

      if (!filename.endsWith('.enc')) {
        return new Response('Only encrypted files (.enc) are allowed', {
          status: 400,
        })
      }

      // Get file hash from the start of the filename
      const fileHash = filename.slice(0, 64) // SHA-256 hash is 64 hex chars

      const fileData = await getFileData(fileHash)
      if (!fileData) {
        return new Response('File not found', { status: 404 })
      }

      await recordDownload(fileData.size)

      // Create a ReadableStream from the file content
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(fileData.content)
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'content-type': 'application/octet-stream',
          'cache-control': 'no-store',
          'content-disposition': `attachment; filename="${FILENAME}"`,
          'content-length': fileData.size.toString(),
        },
      })
    } catch (err) {
      console.error('Download error:', err)
      return new Response('Download failed', { status: 500 })
    }
  },

  async DELETE(req, ctx) {
    try {
      const filename = ctx.params.filename
      if (!filename.endsWith('.enc')) {
        return new Response('Invalid file type', { status: 400 })
      }

      const fileHash = filename.slice(0, 64)

      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response('Authorization required', { status: 401 })
      }
      const deletionKey = authHeader.slice(7)

      const fileData = await getFileData(fileHash)
      if (!fileData) {
        return new Response('File not found', { status: 404 })
      }

      if (fileData.deletionKey !== deletionKey) {
        return new Response('Invalid authorization', { status: 403 })
      }

      await recordDeletion(fileData.size)
      await deleteFileData(fileHash)

      return new Response('File deleted', { status: 200 })
    } catch (err) {
      console.error('Delete error:', err)
      return new Response('Delete failed', { status: 500 })
    }
  },
}

// routes/[filename].tsx
import { Handlers } from '$fresh/server.ts'
import { join } from '$std/path/join.ts'
import { checkQuota, updateQuotas } from '../utils/quotas.ts'
import { addFile, deleteFile, getFile } from '../utils/files.ts'
import { recordDeletion, recordDownload, recordUpload } from '../utils/stats.ts'

const UPLOAD_DIR = Deno.env.get('UPLOAD_DIR') || './uploads'
const MAX_FILE_SIZE = parseInt(Deno.env.get('MAX_FILE_SIZE') || '10485760') // 10MB default
const FILENAME = 'only_you_know'

try {
  await Deno.mkdir(UPLOAD_DIR, { recursive: true })
} catch (e) {
  if (!(e instanceof Deno.errors.AlreadyExists)) {
    throw e
  }
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

      // Read the request body for storage
      const arrayBuffer = await req.arrayBuffer()
      const fileData = new Uint8Array(arrayBuffer)

      // Calculate SHA-256 hash of the file content
      const hash = await crypto.subtle.digest('SHA-256', fileData)
      const hashHex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      // Store file using its hash
      const filePath = join(UPLOAD_DIR, `${hashHex}.enc`)

      // Write file to disk
      await Deno.writeFile(filePath, fileData)
      await updateQuotas(fileSize, true)
      await recordUpload(fileSize)

      // Extract key and IV from the filename
      const authKey = filename.slice(-64 - 32 - 4, -4) // 64 for key, 32 for iv, 4 for .enc

      // Store file info in KV using hash as key
      await addFile(hashHex, {
        size: fileSize,
        created: new Date().toISOString(),
        deletionKey: authKey,
      })

      // Auto-deletion after 24h
      setTimeout(async () => {
        try {
          const fileInfo = await getFile(hashHex)
          if (fileInfo) {
            await recordDeletion(fileInfo.size)
          }
          await deleteFile(hashHex)
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

      const filePath = join(UPLOAD_DIR, `${fileHash}.enc`)

      const fileInfo = await getFile(fileHash)
      if (!fileInfo) {
        return new Response('File not found', { status: 404 })
      }

      await recordDownload(fileInfo.size)

      const file = await Deno.open(filePath)
      const readableStream = file.readable

      return new Response(readableStream, {
        headers: {
          'content-type': 'application/octet-stream',
          'cache-control': 'no-store',
          'content-disposition': `attachment; filename="${FILENAME}"`,
        },
      })
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return new Response('File not found or expired', { status: 404 })
      }
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

      const fileInfo = await getFile(fileHash)
      if (!fileInfo) {
        return new Response('File not found', { status: 404 })
      }

      if (fileInfo.deletionKey !== deletionKey) {
        return new Response('Invalid authorization', { status: 403 })
      }

      await recordDeletion(fileInfo.size)
      await deleteFile(fileHash)

      return new Response('File deleted', { status: 200 })
    } catch (err) {
      console.error('Delete error:', err)
      return new Response('Delete failed', { status: 500 })
    }
  },
}

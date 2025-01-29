// routes/d/[hash].tsx
import { Head } from '$fresh/runtime.ts'
import { Handlers } from '$fresh/server.ts'
import { recordDownload } from '../../utils/stats.ts'
import Decrypt from '../../islands/Decrypt.tsx'

interface FileData {
  content: Uint8Array
  size: number
  created: string
  deletionKey: string
}

const kv = await Deno.openKv()

async function getFileData(key: string): Promise<FileData | null> {
  const res = await kv.get<FileData>(['files', key])
  return res.value
}

// This handler will serve the file content
export const handler: Handlers = {
  async GET(req, ctx) {
    const { hash } = ctx.params
    const key = hash.slice(0, 64) // First 64 chars are the key

    // Check if file exists
    const fileData = await getFileData(key)
    if (!fileData) {
      // Fall back to UI to show error if file not found
      return ctx.render()
    }

    // If direct file request, serve file content
    const url = new URL(req.url)
    if (url.searchParams.has('download')) {
      await recordDownload(fileData.size)

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
          'content-length': fileData.size.toString(),
        },
      })
    }

    // Otherwise render the UI
    return ctx.render({
      fileExists: true,
      created: fileData.created,
      size: fileData.size,
    })
  },
}

export default function DecryptPage(
  props: { data: { fileExists?: boolean; created?: string; size?: number } },
) {
  return (
    <>
      <Head>
        <title>cryptsend - decrypt file</title>
      </Head>
      <div class='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div class='max-w-md w-full space-y-8'>
          <div>
            <h1 class='mt-6 text-center text-3xl font-extrabold text-gray-900'>
              {props.data?.fileExists ? 'Decrypt your file' : 'File not found'}
            </h1>
            {props.data?.fileExists && props.data?.created && (
              <p class='mt-2 text-center text-sm text-gray-600'>
                Uploaded {new Date(props.data.created).toLocaleString()}
              </p>
            )}
            {props.data?.fileExists && props.data?.size && (
              <p class='mt-2 text-center text-sm text-gray-600'>
                Size: {(props.data.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <Decrypt fileExists={props.data?.fileExists} />
        </div>
      </div>
    </>
  )
}

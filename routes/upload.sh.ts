// routes/upload.sh.ts
import { Handlers } from '$fresh/server.ts'
import { readFileSync } from 'fs'

const script = readFileSync('../upload.sh', 'utf-8')

export const handler: Handlers = {
  GET() {
    return new Response(script, {
      headers: {
        'content-type': 'text/plain',
        'cache-control': 'no-cache',
      },
    })
  },
}

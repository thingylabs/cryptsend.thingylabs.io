// routes/upload.sh.ts
import { Handlers } from '$fresh/server.ts'

const script = Deno.readTextFile("../upload.sh")

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

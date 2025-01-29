// routes/upload.sh.ts
import { Handlers } from '$fresh/server.ts'

const script = `#!/bin/bash
FILENAME=$(basename "$1")
KEY=$(openssl rand -hex 32)
IV=$(openssl rand -hex 16)
ENCODED_FILENAME=$(printf %s "$FILENAME" | jq -sRr @uri)

openssl enc -aes-256-cbc -in "$1" -K "$KEY" -iv "$IV" | \\
curl -X PUT "https://upload.thingylabs.io/\${ENCODED_FILENAME}.enc" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @- && \\
echo "https://upload.thingylabs.io/d/#\${KEY}\${IV}\${ENCODED_FILENAME}"`

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

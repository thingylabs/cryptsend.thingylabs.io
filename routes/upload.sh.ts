// routes/upload.sh.ts
import { Handlers } from "$fresh/server.ts"

const script = `#!/bin/bash
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <filename>"
  exit 1
fi

FILENAME=$(basename "$1")
KEY=$(openssl rand -hex 32)
IV=$(openssl rand -hex 16)
ENCODED_FILENAME=$(echo -n "$FILENAME" | xxd -plain | tr -d '\n' | sed 's/\\(.\\{2\\}\\)/%\\1/g')

openssl enc -aes-256-cbc -in "$1" -K "$KEY" -iv "$IV" | \\
curl -s -X PUT "https://cryptsend.thingylabs.io/\${ENCODED_FILENAME}.enc" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @- > /dev/null && \\
echo "https://cryptsend.thingylabs.io/d/#\${KEY}\${IV}\${ENCODED_FILENAME}"
`

export const handler: Handlers = {
  GET() {
    return new Response(script, {
      headers: {
        "content-type": "text/plain",
        "cache-control": "no-cache"
      }
    })
  }
}
// routes/upload.sh.ts
import { Handlers } from '$fresh/server.ts'

// TODO: move this into a bash file within the root directory
const script = `#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <filename>"
  exit 1
}

prerequisites() {
  command -v openssl @>/dev/null || {
    echo "openssl is required!"
    exit 2
  }
}

file() {
  # one argument required
  [ "\${#}" -eq 1 ] || usage()
  
  local file="${1}"
  
  # needs to be a file
  [ -f "\${file}" ] || usage()

  # todo: check if it is a directory
  # if so zip after confirmation

  echo "\${file}"
}

upload() {
  local file="\${1}"
  local filename encoded_filename key iv
  
  filename="$(basename "\${file}")"
  key="$(openssl rand -hex 32)"
  iv="$(openssl rand -hex 16)"
  encoded_filename="$(
    echo -n "\${filename}" | xxd -plain | tr -d '\n' | sed 's/\\(.\\{2\\}\\)/%\\1/g')
  )"
  
  # Use key as hash for storage
  openssl \\
    enc -aes-256-cbc -in "\${file}" -K "\${key}" -iv "\${iv}" |
  curl -s -X PUT "https://cryptsend.thingylabs.io/\${key}.enc" \\
    -H "Content-Type: application/octet-stream" \\
    --data-binary @- > /dev/null

  echo "https://cryptsend.thingylabs.io/d/#\${key}\${iv}\${encoded_filename}"
}

prerequisites
upload "$(file)"
`

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

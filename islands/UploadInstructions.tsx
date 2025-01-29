// islands/UploadInstructions.tsx
import { useState } from 'preact/hooks'

export default function UploadInstructions() {
  const [copied, setCopied] = useState(false)
  const command = `curl -s https://cryptsend.thingylabs.io/upload.sh | bash -s --`

  const handleCopy = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div class='bg-white shadow sm:rounded-lg'>
        <div class='px-4 py-5 sm:p-6'>
          <h2 class='text-lg leading-6 font-medium text-gray-900'>
            Upload encrypted files
          </h2>

          <div class='mt-5'>
            <p class='text-sm text-gray-500'>
              Copy and run this command to upload a file:
            </p>
            <div class='mt-2 relative rounded-md shadow-sm font-mono'>
              <pre class='p-4 bg-gray-50 rounded-md overflow-x-auto'>
                <code>{command} yourfile</code>
              </pre>
              <button
                onClick={handleCopy}
                class='absolute right-2 top-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 
                       text-white text-sm font-medium rounded transition-colors'
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div class='mt-6'>
            <h3 class='text-sm font-medium text-gray-900'>
              How it works
            </h3>
            <div class='mt-2 text-sm text-gray-500'>
              <ol class='list-decimal list-inside space-y-1'>
                <li>Your file is encrypted locally using OpenSSL</li>
                <li>The encrypted file is uploaded securely</li>
                <li>You get a URL containing the decryption key</li>
                <li>Recipients just click the URL to decrypt and download</li>
              </ol>
            </div>
          </div>

          <div class='mt-6'>
            <h3 class='text-sm font-medium text-gray-900'>
              Security features
            </h3>
            <div class='mt-2 text-sm text-gray-500'>
              <ul class='list-disc list-inside space-y-1'>
                <li>AES-256-CBC encryption</li>
                <li>Client-side encryption and decryption</li>
                <li>No server-side key storage</li>
                <li>100MB file size limit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

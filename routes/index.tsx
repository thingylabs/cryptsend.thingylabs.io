// routes/index.tsx
import { Head } from '$fresh/runtime.ts'
import CopyButton from '@/islands/CopyButton.tsx'

export default function Home() {
  return (
    <>
      <Head>
        <title>
          Cryptsend - Secure File Sharing from Your Terminal | Zero Setup CLI
          Tool
        </title>
        <meta
          name='description'
          content='Zero-setup encrypted file sharing from your terminal'
        />
      </Head>

      <div class='max-w-2xl mx-auto px-4 py-12'>
        <div class='space-y-8'>
          <div class='flex justify-between items-center'>
            <h1 class='text-2xl font-bold'>
              cryptsend<span class='text-gray-500'>.thingylabs.io</span>
            </h1>
            <a
              href='https://github.com/thingylabs/cryptsend.thingylabs.io'
              class='text-blue-600 hover:underline'
            >
              GitHub
            </a>
          </div>

          <div>
            <h2 class='text-xl mb-2'>Secure File Sharing</h2>
            <p class='text-gray-600'>
              Share files securely from your terminal with zero setup. Files are
              encrypted before upload using AES-256-CBC.
            </p>
          </div>

          <div>
            <h3 class='font-bold mb-2'>Upload encrypted files</h3>
            <p class='mb-2'>Copy and run this command to upload a file:</p>
            <div class='bg-gray-50 rounded'>
              <code class='font-mono block p-4 text-sm'>
                curl -s https://cryptsend.thingylabs.io/upload.sh | bash -s --
                yourfile.pdf
              </code>
              <div class='border-t bg-gray-100 p-2 flex justify-end'>
                <CopyButton />
              </div>
            </div>
          </div>

          <div>
            <h3 class='font-bold mb-2'>How it works</h3>
            <ol class='list-decimal list-inside space-y-1 text-gray-600'>
              <li>Your file is encrypted locally using OpenSSL</li>
              <li>The encrypted file is uploaded securely</li>
              <li>You get a URL containing the decryption key</li>
              <li>Recipients just click the URL to decrypt and download</li>
            </ol>
          </div>

          <div>
            <h3 class='font-bold mb-2'>Security features</h3>
            <ul class='list-disc list-inside space-y-1 text-gray-600'>
              <li>AES-256-CBC encryption</li>
              <li>Client-side encryption and decryption</li>
              <li>No server-side key storage</li>
              <li>100MB file size limit</li>
            </ul>
          </div>

          <div class='text-sm text-gray-500 flex justify-between items-center pt-4 border-t'>
            <div>
              Built by 🔬<a
                href='https://thingylabs.io'
                class='text-blue-600 hover:underline'
              >
                Thingylabs
              </a>:{' '}
              <a href='https://open.thingylabs.io' class='hover:underline'>
                „We <span class='text-red-500'>♥</span> Open Souce“
              </a>
            </div>
            <div>Zero setup • Client-side encryption</div>
          </div>
        </div>
      </div>
    </>
  )
}

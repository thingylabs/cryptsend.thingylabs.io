// routes/index.tsx
import { Head } from '$fresh/runtime.ts'
import CopyButton from '@/islands/CopyButton.tsx'

export default function Home() {
  return (
    <>
      <Head>
        <title>
          Cryptsend - Secure File Sharing Terminal | Zero Setup CLI Tool
        </title>
        <meta
          name='description'
          content='Zero-setup encrypted file sharing from your terminal'
        />
      </Head>

      <div className='max-w-2xl mx-auto px-4 py-12'>
        <div className='space-y-8'>
          <div className='flex justify-between items-center'>
            <h1 className='text-2xl font-bold'>
              cryptsend<span className='text-gray-500'>.thingylabs.io</span>
            </h1>
            <a
              href='https://github.com/thingylabs/cryptsend.thingylabs.io'
              className='text-blue-600 hover:underline'
            >
              GitHub
            </a>
          </div>

          <div>
            <h2 className='text-xl mb-2'>Secure File Sharing</h2>
            <p className='text-gray-600 dark:text-gray-300'>
              Share files securely from your terminal with zero setup. Files are
              encrypted before upload using AES-256-CBC.
            </p>
          </div>

          <div>
            <h3 className='font-bold mb-2'>Upload encrypted files</h3>
            <p className='mb-2'>Copy and run this command to upload a file:</p>
            <div className='bg-gray-50 dark:bg-gray-800 rounded'>
              <code className='font-mono block p-4 text-sm'>
                curl -s https://cryptsend.thingylabs.io/upload.sh | bash -s --
                yourfile
              </code>
              <div className='border-t bg-gray-100 dark:bg-gray-700 p-2 flex justify-end'>
                <CopyButton />
              </div>
            </div>
          </div>

          <div>
            <h3 className='font-bold mb-2'>How it works</h3>
            <ol className='list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300'>
              <li>Your file is encrypted locally using OpenSSL</li>
              <li>The encrypted file is uploaded securely</li>
              <li>You get a URL containing the decryption key</li>
              <li>Recipients just click the URL to decrypt and download</li>
            </ol>
          </div>

          <div>
            <h3 className='font-bold mb-2'>Security features</h3>
            <ul className='list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300'>
              <li>AES-256-CBC encryption</li>
              <li>Client-side encryption and decryption</li>
              <li>No server-side key storage</li>
              <li>100MB file size limit</li>
              <li>File deletion can be triggered manually</li>
            </ul>
          </div>

          <div className='text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center pt-4 border-t'>
            <div>
              Built by 🔬<a
                href='https://thingylabs.io'
                className='text-blue-600 dark:text-blue-400 hover:underline'
              >
                Thingylabs
              </a>:{' '}
              <a href='https://open.thingylabs.io' className='hover:underline'>
                „We <span className='text-red-500'>♥</span> Open Source“
              </a>
            </div>
            <div>Zero setup, encrypted file sharing for everyone!</div>
          </div>
        </div>
      </div>
    </>
  )
}

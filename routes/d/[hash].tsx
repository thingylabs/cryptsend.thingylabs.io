// routes/d/[hash].tsx
import { Head } from '$fresh/runtime.ts'
import Decrypt from '@/islands/Decrypt.tsx'

export default function DecryptPage() {
  return (
    <>
      <Head>
        <title>cryptsend - decrypt file</title>
      </Head>
      <div class='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div class='max-w-md w-full space-y-8'>
          <div>
            <h1 class='mt-6 text-center text-3xl font-extrabold text-gray-900'>
              Decrypting your file
            </h1>
          </div>
          <Decrypt />
        </div>
      </div>
    </>
  )
}

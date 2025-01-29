// islands/Decrypt.tsx
import { useEffect, useState } from 'preact/hooks'

export default function Decrypt() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const hash = globalThis.location.hash.slice(1)
        if (!hash) {
          setStatus('No encrypted data found')
          return
        }

        // Extract data from hash
        const key = hash.slice(0, 64)
        const iv = hash.slice(64, 96)
        const encodedFilename = hash.slice(96)
        const filename = decodeURIComponent(encodedFilename)

        setStatus('Decrypting file...')

        // Fetch encrypted file
        const response = await fetch(
          `/${encodedFilename}.enc`,
        )
        if (!response.ok) throw new Error('File not found')
        const encryptedData = await response.arrayBuffer()

        const keyMatches = key.match(/.{2}/g)
        const ivMatches = iv.match(/.{2}/g)

        if (!keyMatches || !ivMatches) {
          throw new Error('Invalid encryption key format')
        }

        // Convert hex to Uint8Array
        const keyBuffer = new Uint8Array(
          keyMatches.map((byte) => parseInt(byte, 16)),
        )
        const ivBuffer = new Uint8Array(
          ivMatches.map((byte) => parseInt(byte, 16)),
        )

        // Import the key
        const cryptoKey = await globalThis.crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-CBC' },
          false,
          ['decrypt'],
        )

        // Decrypt the file
        const decrypted = await globalThis.crypto.subtle.decrypt(
          { name: 'AES-CBC', iv: ivBuffer },
          cryptoKey,
          encryptedData,
        )

        // Download the file
        const blob = new Blob([decrypted])
        const url = URL.createObjectURL(blob)
        const a = globalThis.document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)

        setStatus('✓ File decrypted and downloaded')
        setDownloaded(true)
      } catch (err) {
        console.error(err)
        setError(
          'Decryption failed. The file may have been deleted or the URL is invalid.',
        )
      }
    }

    init()
  }, [])

  const handleDelete = async () => {
    try {
      const hash = globalThis.location.hash.slice(1)
      const key = hash.slice(0, 64)
      const iv = hash.slice(64, 96)
      const encodedFilename = hash.slice(96)

      const response = await fetch(`/${encodedFilename}.enc`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${key}${iv}`, // Use key+iv as deletion authorization
        },
      })

      if (!response.ok) throw new Error('Delete failed')
      setStatus('✓ File deleted')
      setDownloaded(false) // Hide delete button after successful deletion
    } catch (_err) {
      setError('Failed to delete file')
    }
  }

  return (
    <div class='text-center'>
      {status && (
        <div class='mb-4 p-4 bg-blue-50 text-blue-700 rounded-md'>
          {status}
        </div>
      )}
      {error && (
        <div class='mb-4 p-4 bg-red-50 text-red-700 rounded-md'>
          {error}
        </div>
      )}
      {downloaded && !error && (
        <button
          onClick={handleDelete}
          class='mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
        >
          Delete file
        </button>
      )}
      <p class='text-gray-500 text-sm mt-4'>
        Files are automatically deleted after 24 hours
      </p>
    </div>
  )
}

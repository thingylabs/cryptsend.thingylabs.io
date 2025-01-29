// islands/CopyButton.tsx
import { useState } from 'preact/hooks'

export default function CopyButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(
      'curl -s https://upload.thingylabs.io/upload.sh | bash -s -- yourfile',
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      class='px-3 py-1.5 
             bg-blue-500 hover:bg-blue-600 active:bg-blue-700
             text-white text-sm font-medium rounded-full 
             transition-colors duration-200'
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy command'}
    </button>
  )
}

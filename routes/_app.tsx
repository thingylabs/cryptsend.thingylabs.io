// routes/_app.tsx
import { AppProps } from '$fresh/server.ts'
import { asset } from '$fresh/runtime.ts'

export default function App({ Component }: AppProps) {
  return (
    <html className='dark:bg-gray-900 dark:text-white'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='stylesheet' href={asset('/styles.css')} />
      </head>
      <body className='bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300'>
        <Component />
      </body>
    </html>
  )
}

// tailwind.config.ts
import { type Config } from 'tailwindcss'

export default {
  content: [
    '{routes,islands,components}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
    },
  },
} satisfies Config

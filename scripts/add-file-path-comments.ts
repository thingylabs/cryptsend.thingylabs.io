// scripts/add-file-path-comments.ts
import { walk } from 'https://deno.land/std@0.224.0/fs/mod.ts'
import { relative, resolve } from 'https://deno.land/std@0.224.0/path/mod.ts'
import { globToRegExp } from 'https://deno.land/std@0.223.0/path/mod.ts'

async function readGitignore(rootDir: string): Promise<RegExp[]> {
  try {
    const gitignorePath = `${rootDir}/.gitignore`
    const content = await Deno.readTextFile(gitignorePath)

    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((pattern) => {
        const regexPattern = pattern
          .replace(/^\/|\/$/g, '')
          .replace(/\*\*/g, '{{GLOBSTAR}}')
          .replace(/\*/g, '[^/]*')
          .replace(/\?/g, '[^/]')
          .replace(/{{GLOBSTAR}}/g, '.*')
        return globToRegExp(regexPattern)
      })
  } catch {
    return []
  }
}

function isIgnored(path: string, ignorePatterns: RegExp[]): boolean {
  return ignorePatterns.some((pattern) => pattern.test(path))
}

const SPECIAL_FILES = new Set([
  'dev.ts',
  'main.ts',
  'fresh.config.ts',
  'fresh.gen.ts',
  'tailwind.config.ts',
])

async function addFilePathComments(directory: string) {
  const fileTypes = ['.js', '.ts', '.tsx']
  const rootDir = resolve(directory)
  const ignorePatterns = await readGitignore(rootDir)

  for await (
    const entry of walk(rootDir, {
      includeDirs: false,
      exts: fileTypes.map((ext) => ext.slice(1)),
      skip: [
        /node_modules/,
        /\.git/,
        /denokv-bridge/,
        /_fresh/,
        /static/,
      ],
    })
  ) {
    const filePath = entry.path
    const relativePath = relative(rootDir, filePath)

    // Skip special files
    if (SPECIAL_FILES.has(relativePath)) {
      console.log(`Skipping special file: ${relativePath}`)
      continue
    }

    if (isIgnored(relativePath, ignorePatterns)) {
      console.log(`Skipping ${relativePath} - matches .gitignore pattern`)
      continue
    }

    const content = await Deno.readTextFile(filePath)
    const lines = content.split('\n')

    // Remove empty lines and old comments from the start
    while (
      lines.length > 0 &&
      (lines[0].trim() === '' ||
        lines[0].trim().startsWith('// File:') ||
        lines[0].trim().startsWith('// '))
    ) {
      lines.shift()
    }

    // Add our comment at the start
    lines.unshift(`// ${relativePath}`)

    const newContent = lines.join('\n')
    await Deno.writeTextFile(filePath, newContent)
    console.log(`Added comment to ${relativePath}`)
  }
}

if (import.meta.main) {
  const directory = Deno.args[0] || '.'
  try {
    await addFilePathComments(directory)
    console.log('Finished adding file path comments')
  } catch (e) {
    const error = e as Error
    console.error('Error:', error.message)
    Deno.exit(1)
  }
}

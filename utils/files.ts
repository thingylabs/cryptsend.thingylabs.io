// utils/files.ts
import { join } from '$std/path/join.ts'
import { updateQuotas } from './quotas.ts'

const kv = await Deno.openKv()

interface FileInfo {
  size: number
  created: string
  deletionKey: string // We'll use the key+iv as deletion key
}

export async function addFile(filename: string, info: FileInfo) {
  await kv.set(['files', filename], info)
}

export async function getFile(filename: string): Promise<FileInfo | null> {
  const res = await kv.get<FileInfo>(['files', filename])
  return res.value
}

export async function deleteFile(filename: string) {
  const fileInfo = await getFile(filename)
  if (!fileInfo) return

  const filePath = join(Deno.env.get('UPLOAD_DIR') || './uploads', filename)

  // Delete from disk
  try {
    await Deno.remove(filePath)
  } catch {
    // Ignore if file doesn't exist
  }

  // Delete from KV
  await kv.delete(['files', filename])

  // Update quotas
  await updateQuotas(fileInfo.size, false)
}

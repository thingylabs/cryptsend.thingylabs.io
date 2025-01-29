// utils/stats.ts
const kv = await Deno.openKv()

interface DayStats {
  bytesTransferred: number
  bytesStored: number
  timestamp: string
}

interface Stats {
  totalBytesTransferred: number
  totalBytesStored: number
  currentBytesStored: number
  dailyStats: Record<string, DayStats>
}

// Get a standardized date key (YYYY-MM-DD)
function getDateKey(date = new Date()): string {
  return date.toISOString().split('T')[0]
}

// Get stats, initialize if not exists
async function getStats(): Promise<Stats> {
  const res = await kv.get<Stats>(['stats'])
  return res.value || {
    totalBytesTransferred: 0,
    totalBytesStored: 0,
    currentBytesStored: 0,
    dailyStats: {},
  }
}

// Update stats for file upload
export async function recordUpload(bytes: number) {
  const statsRes = await kv.get<Stats>(['stats'])
  const stats = statsRes.value || {
    totalBytesTransferred: 0,
    totalBytesStored: 0,
    currentBytesStored: 0,
    dailyStats: {},
  }

  const dateKey = getDateKey()
  const today = stats.dailyStats[dateKey] || {
    bytesTransferred: 0,
    bytesStored: 0,
    timestamp: new Date().toISOString(),
  }

  // Update totals
  stats.totalBytesTransferred += bytes
  stats.totalBytesStored += bytes
  stats.currentBytesStored += bytes

  // Update daily stats
  today.bytesTransferred += bytes
  today.bytesStored += bytes
  stats.dailyStats[dateKey] = today

  // Clean up old daily stats (keep last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const oldestAllowedDate = getDateKey(thirtyDaysAgo)

  stats.dailyStats = Object.fromEntries(
    Object.entries(stats.dailyStats)
      .filter(([date]) => date >= oldestAllowedDate),
  )

  await kv.set(['stats'], stats)
}

// Update stats for file deletion
export async function recordDeletion(bytes: number) {
  const statsRes = await kv.get<Stats>(['stats'])
  const stats = statsRes.value || {
    totalBytesTransferred: 0,
    totalBytesStored: 0,
    currentBytesStored: 0,
    dailyStats: {},
  }

  // Only decrease current storage, keep historical stats
  stats.currentBytesStored -= bytes

  await kv.set(['stats'], stats)
}

// Update stats for file download
export async function recordDownload(bytes: number) {
  const statsRes = await kv.get<Stats>(['stats'])
  const stats = statsRes.value || {
    totalBytesTransferred: 0,
    totalBytesStored: 0,
    currentBytesStored: 0,
    dailyStats: {},
  }

  const dateKey = getDateKey()
  const today = stats.dailyStats[dateKey] || {
    bytesTransferred: 0,
    bytesStored: 0,
    timestamp: new Date().toISOString(),
  }

  // Update totals
  stats.totalBytesTransferred += bytes

  // Update daily stats
  today.bytesTransferred += bytes
  stats.dailyStats[dateKey] = today

  await kv.set(['stats'], stats)
}

// Get current stats
export async function getServiceStats(): Promise<Stats> {
  return await getStats()
}

// Human readable size formatter
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

// routes/api/stats.ts
import { Handlers } from '$fresh/server.ts'
import { formatBytes, getServiceStats } from '../../utils/stats.ts'

export const handler: Handlers = {
  async GET(_req) {
    try {
      const stats = await getServiceStats()

      // Format the stats for display
      const formattedStats = {
        total: {
          transferred: formatBytes(stats.totalBytesTransferred),
          stored: formatBytes(stats.totalBytesStored),
        },
        current: {
          stored: formatBytes(stats.currentBytesStored),
        },
        daily: Object.entries(stats.dailyStats).map(([date, stat]) => ({
          date,
          transferred: formatBytes(stat.bytesTransferred),
          stored: formatBytes(stat.bytesStored),
        })).sort((a, b) => b.date.localeCompare(a.date)),
      }

      return new Response(JSON.stringify(formattedStats, null, 2), {
        headers: {
          'content-type': 'application/json',
        },
      })
    } catch (err) {
      console.error('Stats error:', err)
      return new Response('Failed to get stats', { status: 500 })
    }
  },
}

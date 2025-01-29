// utils/quotas.ts
const DEFAULT_MAX_STORAGE = 100 * 1024 * 1024 // 100MB total storage
const DEFAULT_MAX_TRANSFER = 1024 * 1024 * 1024 // 1GB monthly transfer

const kv = await Deno.openKv()

interface Quotas {
  currentStorage: number
  monthlyTransfer: number
  lastReset: string
}

async function checkAndResetMonthly() {
  const quotasRes = await kv.get<Quotas>(['quotas'])
  const quotas = quotasRes.value || {
    currentStorage: 0,
    monthlyTransfer: 0,
    lastReset: new Date().toISOString(),
  }

  const lastReset = new Date(quotas.lastReset)
  const now = new Date()

  if (
    lastReset.getMonth() !== now.getMonth() ||
    lastReset.getFullYear() !== now.getFullYear()
  ) {
    quotas.monthlyTransfer = 0
    quotas.lastReset = now.toISOString()
    await kv.set(['quotas'], quotas)
  }
}

export async function checkQuota(fileSize: number): Promise<boolean> {
  try {
    await checkAndResetMonthly()
    const quotasRes = await kv.get<Quotas>(['quotas'])
    const quotas = quotasRes.value || {
      currentStorage: 0,
      monthlyTransfer: 0,
      lastReset: new Date().toISOString(),
    }

    const maxStorage = parseInt(
      Deno.env.get('MAX_STORAGE') || String(DEFAULT_MAX_STORAGE),
    )
    const maxTransfer = parseInt(
      Deno.env.get('MAX_MONTHLY_TRANSFER') || String(DEFAULT_MAX_TRANSFER),
    )

    if (quotas.currentStorage + fileSize > maxStorage) {
      console.error('Storage quota exceeded')
      return false
    }

    if (quotas.monthlyTransfer + fileSize > maxTransfer) {
      console.error('Monthly transfer quota exceeded')
      return false
    }

    return true
  } catch (e) {
    console.error('Error checking quotas:', e)
    return false
  }
}

export async function updateQuotas(fileSize: number, isUpload = true) {
  const quotasRes = await kv.get<Quotas>(['quotas'])
  const quotas = quotasRes.value || {
    currentStorage: 0,
    monthlyTransfer: 0,
    lastReset: new Date().toISOString(),
  }

  if (isUpload) {
    quotas.currentStorage += fileSize
    quotas.monthlyTransfer += fileSize
  } else {
    quotas.currentStorage -= fileSize
  }

  await kv.set(['quotas'], quotas)
}

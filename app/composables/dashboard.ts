// app/composables/dashboard.ts
import { ref } from 'vue'

export interface WeeklyTrendItem {
  day: string
  total: number
}

export interface DashboardStats {
  totalPesananHariIni: number
  pesananGrowth: number
  totalProduk: number
  totalKaryawan: number
  weeklyData: WeeklyTrendItem[]
}

export function useDashboard(pollIntervalMs = 30000) {
  const stats = ref<DashboardStats>({
    totalPesananHariIni: 0,
    pesananGrowth: 0,
    totalProduk: 0,
    totalKaryawan: 0,
    weeklyData: [
      { day: 'Sen', total: 0 },
      { day: 'Sel', total: 0 },
      { day: 'Rab', total: 0 },
      { day: 'Kam', total: 0 },
      { day: 'Jum', total: 0 },
      { day: 'Sab', total: 0 },
      { day: 'Min', total: 0 },
    ]
  })

  const pending = ref(false)
  const error = ref<string | null>(null)
  let timer: NodeJS.Timeout | null = null

  // Fungsi fetch data dari API backend
  const fetchDashboardData = async () => {
    pending.value = true
    error.value = null
    try {
      // Sesuaikan endpoint backend Anda (misal: /api/dashboard/stats)
      const data = await $fetch<DashboardStats>('/api/dashboard/stats')
      if (data) {
        stats.value = data
      }
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Gagal memuat data dashboard'
    } finally {
      pending.value = false
    }
  }

  // Mulai auto-refresh / polling real-time data
  const startPolling = () => {
    if (import.meta.client && !timer) {
      timer = setInterval(() => {
        fetchDashboardData()
      }, pollIntervalMs)
    }
  }

  // Hentikan polling saat komponen unmount
  const stopPolling = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    stats,
    pending,
    error,
    fetchDashboardData,
    startPolling,
    stopPolling
  }
}
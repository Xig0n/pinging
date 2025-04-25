// Exportar todas las funciones del servidor
export {
  getMonitors,
  getMonitorById,
  addMonitor,
  updateMonitor,
  deleteMonitor,
  getLogs,
  getMonitorLogs,
  getMonitorLogsByTimeRange,
  addLog,
  calculateUptime,
  getTelegramConfig,
  updateTelegramConfig,
} from "@/lib/db-server"

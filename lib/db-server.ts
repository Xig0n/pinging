import fs from "fs"
import path from "path"
import { cache } from "react"
import type { Monitor, LogEntry } from "@/lib/types"

const DATA_DIR = path.join(process.cwd(), "data")
const MONITORS_FILE = path.join(DATA_DIR, "monitors.json")
const LOGS_FILE = path.join(DATA_DIR, "logs.json")
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json")

// Asegurar que el directorio de datos existe
export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  if (!fs.existsSync(MONITORS_FILE)) {
    fs.writeFileSync(MONITORS_FILE, JSON.stringify([]), "utf-8")
  }

  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]), "utf-8")
  }

  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify({
        telegramBotToken: "",
        telegramChatId: "",
        notificationsEnabled: false,
      }),
      "utf-8",
    )
  }
}

// Leer monitores
export const getMonitors = cache((): Monitor[] => {
  ensureDataDir()
  try {
    const data = fs.readFileSync(MONITORS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al leer los monitores:", error)
    return []
  }
})

// Obtener un monitor por ID
export const getMonitorById = cache((id: string): Monitor | null => {
  const monitors = getMonitors()
  return monitors.find((monitor) => monitor.id === id) || null
})

// Guardar monitores
export function saveMonitors(monitors: Monitor[]) {
  ensureDataDir()
  fs.writeFileSync(MONITORS_FILE, JSON.stringify(monitors, null, 2), "utf-8")
}

// Añadir un nuevo monitor
export function addMonitor(monitor: Omit<Monitor, "id" | "createdAt" | "status">): Monitor {
  const monitors = getMonitors()
  const newMonitor: Monitor = {
    ...monitor,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: "unknown",
    paused: false,
  }

  monitors.push(newMonitor)
  saveMonitors(monitors)
  return newMonitor
}

// Actualizar un monitor
export function updateMonitor(id: string, data: Partial<Monitor>): Monitor | null {
  const monitors = getMonitors()
  const index = monitors.findIndex((m) => m.id === id)

  if (index === -1) return null

  monitors[index] = { ...monitors[index], ...data }
  saveMonitors(monitors)

  // Comprobar si hay que enviar notificación
  const prevStatus = monitors[index].status
  const newStatus = data.status

  if (newStatus && prevStatus !== newStatus) {
    checkAndSendNotification(monitors[index], newStatus, data.lastError)
  }

  return monitors[index]
}

// Eliminar un monitor
export function deleteMonitor(id: string): boolean {
  const monitors = getMonitors()
  const filteredMonitors = monitors.filter((m) => m.id !== id)

  if (filteredMonitors.length === monitors.length) return false

  saveMonitors(filteredMonitors)
  return true
}

// Leer logs
export const getLogs = cache((): LogEntry[] => {
  ensureDataDir()
  try {
    const data = fs.readFileSync(LOGS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al leer los logs:", error)
    return []
  }
})

// Obtener logs de un monitor específico
export const getMonitorLogs = cache((monitorId: string, limit?: number): LogEntry[] => {
  const logs = getLogs()
  const monitorLogs = logs.filter((log) => log.monitorId === monitorId)

  // Ordenar por timestamp descendente (más reciente primero)
  monitorLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (limit) {
    return monitorLogs.slice(0, limit)
  }

  return monitorLogs
})

// Filtrar logs por rango de tiempo
export const getMonitorLogsByTimeRange = cache(
  (monitorId: string, timeRange: "recent" | "3h" | "9h" | "1d"): LogEntry[] => {
    const logs = getMonitorLogs(monitorId)
    const now = new Date()

    let timeLimit: Date
    switch (timeRange) {
      case "recent":
        timeLimit = new Date(now.getTime() - 1 * 60 * 60 * 1000) // Última hora
        break
      case "3h":
        timeLimit = new Date(now.getTime() - 3 * 60 * 60 * 1000)
        break
      case "9h":
        timeLimit = new Date(now.getTime() - 9 * 60 * 60 * 1000)
        break
      case "1d":
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    return logs.filter((log) => new Date(log.timestamp) >= timeLimit)
  },
)

// Añadir un nuevo log
export function addLog(log: Omit<LogEntry, "id" | "timestamp">): LogEntry {
  const logs = getLogs()
  const newLog: LogEntry = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  }

  logs.push(newLog)
  saveLogs(logs)

  // Actualizar el estado del monitor
  updateMonitor(log.monitorId, {
    status: log.status,
    responseTime: log.responseTime,
    lastChecked: newLog.timestamp,
    lastError: log.error,
  })

  return newLog
}

// Guardar logs
export function saveLogs(logs: LogEntry[]) {
  ensureDataDir()
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8")
}

// Calcular el uptime de un monitor
export const calculateUptime = cache((monitorId: string, days = 7): number => {
  const logs = getMonitorLogs(monitorId)
  const now = new Date()
  const timeLimit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const recentLogs = logs.filter((log) => new Date(log.timestamp) >= timeLimit)

  if (recentLogs.length === 0) return 100

  const upLogs = recentLogs.filter((log) => log.status === "up")
  return Number.parseFloat(((upLogs.length / recentLogs.length) * 100).toFixed(1))
})

// Funciones para configuración de Telegram
export const getTelegramConfig = cache(() => {
  ensureDataDir()
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf-8")
    const settings = JSON.parse(data)
    return {
      botToken: settings.telegramBotToken || "",
      chatId: settings.telegramChatId || "",
      enabled: !!settings.notificationsEnabled,
    }
  } catch (error) {
    console.error("Error al leer la configuración de Telegram:", error)
    return {
      botToken: "",
      chatId: "",
      enabled: false,
    }
  }
})

export function updateTelegramConfig(botToken: string, chatId: string, enabled: boolean) {
  ensureDataDir()
  const settings = {
    telegramBotToken: botToken,
    telegramChatId: chatId,
    notificationsEnabled: enabled,
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8")
  return getTelegramConfig()
}

// Función para enviar notificaciones
async function checkAndSendNotification(monitor: Monitor, status: string, error?: string) {
  // Obtener configuración de Telegram
  const telegramConfig = getTelegramConfig()
  if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
    return
  }

  await sendTelegramNotification(monitor, status, error)
}

async function sendTelegramNotification(monitor: Monitor, status: string, error?: string) {
  const telegramConfig = getTelegramConfig()

  if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
    return
  }

  const statusEmoji = status === "up" ? "✅" : "❌"
  const message =
    `${statusEmoji} *${monitor.name}* está ${status === "up" ? "ACTIVO" : "CAÍDO"}\n\n` +
    `URL: ${monitor.url}\n` +
    `Tipo: ${monitor.type.toUpperCase()}\n` +
    (error ? `Error: ${error}\n` : "") +
    `Fecha: ${new Date().toLocaleString()}`

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramConfig.chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    })

    if (!response.ok) {
      console.error("Error al enviar notificación a Telegram:", await response.text())
    }
  } catch (error) {
    console.error("Error al enviar notificación a Telegram:", error)
  }
}

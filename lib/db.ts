import Database from "better-sqlite3"
import fs from "fs"
import path from "path"
import type { Monitor, LogEntry } from "@/lib/types"

const DATA_DIR = path.join(process.cwd(), "data")
const DB_PATH = path.join(DATA_DIR, "pinging.db")

// Asegurar que el directorio de datos existe
export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Inicializar la base de datos
let db: Database.Database

export function getDb() {
  if (!db) {
    ensureDataDir()
    db = new Database(DB_PATH)
    initializeDb()
  }
  return db
}

// Crear las tablas si no existen
function initializeDb() {
  const db = getDb()

  // Tabla de monitores
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      interval REAL NOT NULL,
      status TEXT DEFAULT 'unknown',
      paused INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      lastChecked TEXT,
      responseTime INTEGER,
      lastError TEXT,
      data TEXT,
      tags TEXT
    )
  `)

  // Tabla de logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      monitorId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      responseTime INTEGER NOT NULL,
      statusCode INTEGER,
      error TEXT,
      data TEXT,
      FOREIGN KEY (monitorId) REFERENCES monitors(id) ON DELETE CASCADE
    )
  `)

  // Tabla de configuración
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      telegramBotToken TEXT,
      telegramChatId TEXT,
      notificationsEnabled INTEGER DEFAULT 0
    )
  `)

  // Insertar configuración por defecto si no existe
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number }
  if (settingsCount.count === 0) {
    db.prepare("INSERT INTO settings (id, notificationsEnabled) VALUES (?, ?)").run("global", 0)
  }
}

// Funciones para monitores
export function getMonitors(): Monitor[] {
  const db = getDb()
  const monitors = db.prepare("SELECT * FROM monitors ORDER BY createdAt DESC").all() as any[]

  return monitors.map((monitor) => {
    // Convertir datos adicionales de JSON a objeto
    const data = monitor.data ? JSON.parse(monitor.data) : {}
    // Convertir tags de string a array
    const tags = monitor.tags ? monitor.tags.split(",").map((tag: string) => tag.trim()) : []

    return {
      ...monitor,
      ...data,
      paused: !!monitor.paused, // Convertir a booleano
      tags,
    }
  })
}

export function getMonitorById(id: string): Monitor | null {
  const db = getDb()
  const monitor = db.prepare("SELECT * FROM monitors WHERE id = ?").get(id) as any

  if (!monitor) return null

  // Convertir datos adicionales de JSON a objeto
  const data = monitor.data ? JSON.parse(monitor.data) : {}
  // Convertir tags de string a array
  const tags = monitor.tags ? monitor.tags.split(",").map((tag: string) => tag.trim()) : []

  return {
    ...monitor,
    ...data,
    paused: !!monitor.paused, // Convertir a booleano
    tags,
  }
}

export function addMonitor(monitorData: Omit<Monitor, "id" | "createdAt" | "status">): Monitor {
  const db = getDb()

  // Extraer datos básicos para la tabla principal
  const { name, url, interval, type, paused, tags, ...extraData } = monitorData

  // Crear ID y timestamp
  const id = Date.now().toString()
  const createdAt = new Date().toISOString()

  // Convertir tags a string
  const tagsString = Array.isArray(tags) ? tags.join(",") : ""

  // Insertar en la base de datos
  db.prepare(`
    INSERT INTO monitors (id, name, url, type, interval, paused, createdAt, status, data, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, url, type, interval, paused ? 1 : 0, createdAt, "unknown", JSON.stringify(extraData), tagsString)

  // Devolver el monitor completo
  return getMonitorById(id) as Monitor
}

export function updateMonitor(id: string, updateData: Partial<Monitor>): Monitor | null {
  const db = getDb()

  // Obtener el monitor actual
  const currentMonitor = getMonitorById(id)
  if (!currentMonitor) return null

  // Extraer datos básicos para la tabla principal
  const { name, url, interval, type, paused, status, lastChecked, responseTime, lastError, tags, ...extraData } =
    updateData

  // Construir la consulta de actualización
  const updates: string[] = []
  const params: any[] = []

  if (name !== undefined) {
    updates.push("name = ?")
    params.push(name)
  }

  if (url !== undefined) {
    updates.push("url = ?")
    params.push(url)
  }

  if (type !== undefined) {
    updates.push("type = ?")
    params.push(type)
  }

  if (interval !== undefined) {
    updates.push("interval = ?")
    params.push(interval)
  }

  if (paused !== undefined) {
    updates.push("paused = ?")
    params.push(paused ? 1 : 0)
  }

  if (status !== undefined) {
    updates.push("status = ?")
    params.push(status)
  }

  if (lastChecked !== undefined) {
    updates.push("lastChecked = ?")
    params.push(lastChecked)
  }

  if (responseTime !== undefined) {
    updates.push("responseTime = ?")
    params.push(responseTime)
  }

  if (lastError !== undefined) {
    updates.push("lastError = ?")
    params.push(lastError)
  }

  if (tags !== undefined) {
    updates.push("tags = ?")
    params.push(Array.isArray(tags) ? tags.join(",") : "")
  }

  // Actualizar datos extra
  if (Object.keys(extraData).length > 0) {
    // Combinar con datos existentes
    const currentExtraData = currentMonitor.data ? JSON.parse(currentMonitor.data) : {}
    const newExtraData = { ...currentExtraData, ...extraData }
    updates.push("data = ?")
    params.push(JSON.stringify(newExtraData))
  }

  // Si no hay actualizaciones, devolver el monitor actual
  if (updates.length === 0) return currentMonitor

  // Añadir el ID al final de los parámetros
  params.push(id)

  // Ejecutar la actualización
  db.prepare(`UPDATE monitors SET ${updates.join(", ")} WHERE id = ?`).run(...params)

  // Devolver el monitor actualizado
  return getMonitorById(id) as Monitor
}

export function deleteMonitor(id: string): boolean {
  const db = getDb()

  // Eliminar el monitor
  const result = db.prepare("DELETE FROM monitors WHERE id = ?").run(id)

  // Devolver true si se eliminó algún registro
  return result.changes > 0
}

// Funciones para logs
export function getLogs(): LogEntry[] {
  const db = getDb()
  const logs = db.prepare("SELECT * FROM logs ORDER BY timestamp DESC").all() as any[]

  return logs.map((log) => {
    // Convertir datos adicionales de JSON a objeto
    const data = log.data ? JSON.parse(log.data) : {}

    return {
      ...log,
      ...data,
    }
  })
}

export function getMonitorLogs(monitorId: string, limit?: number): LogEntry[] {
  const db = getDb()

  let query = "SELECT * FROM logs WHERE monitorId = ? ORDER BY timestamp DESC"
  if (limit) {
    query += ` LIMIT ${limit}`
  }

  const logs = db.prepare(query).all(monitorId) as any[]

  return logs.map((log) => {
    // Convertir datos adicionales de JSON a objeto
    const data = log.data ? JSON.parse(log.data) : {}

    return {
      ...log,
      ...data,
    }
  })
}

export function getMonitorLogsByTimeRange(monitorId: string, timeRange: "recent" | "3h" | "9h" | "1d"): LogEntry[] {
  const db = getDb()
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

  const logs = db
    .prepare("SELECT * FROM logs WHERE monitorId = ? AND timestamp >= ? ORDER BY timestamp DESC")
    .all(monitorId, timeLimit.toISOString()) as any[]

  return logs.map((log) => {
    // Convertir datos adicionales de JSON a objeto
    const data = log.data ? JSON.parse(log.data) : {}

    return {
      ...log,
      ...data,
    }
  })
}

export function addLog(logData: Omit<LogEntry, "id" | "timestamp">): LogEntry {
  const db = getDb()

  // Extraer datos básicos para la tabla principal
  const { monitorId, status, responseTime, statusCode, error, ...extraData } = logData

  // Crear ID y timestamp
  const id = Date.now().toString()
  const timestamp = new Date().toISOString()

  // Insertar en la base de datos
  db.prepare(`
    INSERT INTO logs (id, monitorId, timestamp, status, responseTime, statusCode, error, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, monitorId, timestamp, status, responseTime, statusCode || null, error || null, JSON.stringify(extraData))

  // Actualizar el estado del monitor
  updateMonitor(monitorId, {
    status,
    responseTime,
    lastChecked: timestamp,
    lastError: error,
  })

  // Comprobar si hay que enviar notificación
  checkAndSendNotification(monitorId, status, error)

  // Devolver el log completo
  return {
    id,
    monitorId,
    timestamp,
    status,
    responseTime,
    statusCode,
    error,
    ...extraData,
  }
}

// Calcular el uptime de un monitor
export function calculateUptime(monitorId: string, days = 7): number {
  const db = getDb()
  const now = new Date()
  const timeLimit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // Contar logs totales en el período
  const totalLogs = db
    .prepare("SELECT COUNT(*) as count FROM logs WHERE monitorId = ? AND timestamp >= ?")
    .get(monitorId, timeLimit.toISOString()) as { count: number }

  if (totalLogs.count === 0) return 100

  // Contar logs con estado "up" en el período
  const upLogs = db
    .prepare('SELECT COUNT(*) as count FROM logs WHERE monitorId = ? AND timestamp >= ? AND status = "up"')
    .get(monitorId, timeLimit.toISOString()) as { count: number }

  return Number.parseFloat(((upLogs.count / totalLogs.count) * 100).toFixed(1))
}

// Funciones para configuración de Telegram
export function getTelegramConfig() {
  const db = getDb()
  const config = db
    .prepare("SELECT telegramBotToken, telegramChatId, notificationsEnabled FROM settings WHERE id = ?")
    .get("global") as {
    telegramBotToken: string | null
    telegramChatId: string | null
    notificationsEnabled: number
  }

  return {
    botToken: config.telegramBotToken || "",
    chatId: config.telegramChatId || "",
    enabled: !!config.notificationsEnabled,
  }
}

export function updateTelegramConfig(botToken: string, chatId: string, enabled: boolean) {
  const db = getDb()

  db.prepare(`
    UPDATE settings 
    SET telegramBotToken = ?, telegramChatId = ?, notificationsEnabled = ? 
    WHERE id = ?
  `).run(botToken, chatId, enabled ? 1 : 0, "global")

  return getTelegramConfig()
}

// Función para enviar notificaciones
async function checkAndSendNotification(monitorId: string, status: string, error?: string) {
  const db = getDb()

  // Obtener configuración de Telegram
  const telegramConfig = getTelegramConfig()
  if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
    return
  }

  // Obtener el monitor
  const monitor = getMonitorById(monitorId)
  if (!monitor) return

  // Obtener el último log anterior para ver si ha cambiado el estado
  const previousLogs = db
    .prepare("SELECT status FROM logs WHERE monitorId = ? ORDER BY timestamp DESC LIMIT 1 OFFSET 1")
    .get(monitorId) as { status: string } | undefined

  // Si no hay logs anteriores o el estado ha cambiado, enviar notificación
  if (!previousLogs || previousLogs.status !== status) {
    await sendTelegramNotification(monitor, status, error)
  }
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

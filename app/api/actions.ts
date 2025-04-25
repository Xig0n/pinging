"use server"

import { revalidatePath } from "next/cache"
import {
  addMonitor,
  updateMonitor,
  deleteMonitor,
  addLog,
  getMonitors,
  getMonitorById,
  getMonitorLogsByTimeRange,
  calculateUptime,
  getTelegramConfig,
  updateTelegramConfig,
} from "@/lib/data"
import { checkMonitorByType } from "@/lib/http-checker"
import type { HttpMethod, MonitorType } from "@/lib/types"

// Acción para crear un nuevo monitor
export async function createMonitor(formData: FormData) {
  const name = formData.get("name") as string
  const url = formData.get("url") as string
  const interval = Number.parseFloat(formData.get("interval") as string)
  const type = formData.get("type") as MonitorType
  const tags = formData.get("tags") as string

  if (!name || !url || !interval || !type) {
    throw new Error("Todos los campos obligatorios deben ser completados")
  }

  // Datos básicos del monitor
  const monitorData: any = {
    name,
    url,
    interval,
    type,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    paused: false,
  }

  // Datos específicos según el tipo
  switch (type) {
    case "http":
      monitorData.method = (formData.get("method") as HttpMethod) || "GET"
      monitorData.expectedStatus = Number.parseInt(formData.get("expectedStatus") as string) || 200

      // Headers
      const headers = formData.get("headers") as string
      if (headers && headers.trim() !== "") {
        try {
          monitorData.headers = JSON.parse(headers)
        } catch (error) {
          throw new Error("El formato de los headers es inválido. Debe ser un objeto JSON válido.")
        }
      }

      // Body
      const body = formData.get("body") as string
      if (body && body.trim() !== "") {
        monitorData.body = body
      }

      // Certificado SSL
      monitorData.checkCertificate = formData.get("checkCertificate") === "true"
      break

    case "tcp":
      monitorData.port = Number.parseInt(formData.get("port") as string) || 80
      break

    case "ping":
      monitorData.packetCount = (formData.get("packetCount") as string) || "4"
      break

    case "dns":
      monitorData.dnsServer = formData.get("dnsServer") as string
      monitorData.dnsRecordType = (formData.get("dnsRecordType") as string) || "A"
      monitorData.dnsExpectedResult = formData.get("dnsExpectedResult") as string
      break
  }

  // Proxy
  monitorData.useProxy = formData.get("useProxy") === "true"
  if (monitorData.useProxy) {
    monitorData.proxyUrl = formData.get("proxyUrl") as string
  }

  const newMonitor = addMonitor(monitorData)

  revalidatePath("/")
  return newMonitor
}

// Acción para actualizar un monitor existente
export async function updateExistingMonitor(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const url = formData.get("url") as string
  const interval = Number.parseFloat(formData.get("interval") as string)
  const type = formData.get("type") as MonitorType
  const tags = formData.get("tags") as string

  if (!name || !url || !interval || !type) {
    throw new Error("Todos los campos obligatorios deben ser completados")
  }

  // Datos básicos del monitor
  const monitorData: any = {
    name,
    url,
    interval,
    type,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
  }

  // Datos específicos según el tipo
  switch (type) {
    case "http":
      monitorData.method = (formData.get("method") as HttpMethod) || "GET"
      monitorData.expectedStatus = Number.parseInt(formData.get("expectedStatus") as string) || 200

      // Headers
      const headers = formData.get("headers") as string
      if (headers && headers.trim() !== "") {
        try {
          monitorData.headers = JSON.parse(headers)
        } catch (error) {
          throw new Error("El formato de los headers es inválido. Debe ser un objeto JSON válido.")
        }
      } else {
        monitorData.headers = undefined
      }

      // Body
      const body = formData.get("body") as string
      if (body && body.trim() !== "") {
        monitorData.body = body
      } else {
        monitorData.body = undefined
      }

      // Certificado SSL
      monitorData.checkCertificate = formData.get("checkCertificate") === "true"
      break

    case "tcp":
      monitorData.port = Number.parseInt(formData.get("port") as string) || 80
      break

    case "ping":
      monitorData.packetCount = (formData.get("packetCount") as string) || "4"
      break

    case "dns":
      monitorData.dnsServer = formData.get("dnsServer") as string
      monitorData.dnsRecordType = (formData.get("dnsRecordType") as string) || "A"
      monitorData.dnsExpectedResult = formData.get("dnsExpectedResult") as string
      break
  }

  // Proxy
  monitorData.useProxy = formData.get("useProxy") === "true"
  if (monitorData.useProxy) {
    monitorData.proxyUrl = formData.get("proxyUrl") as string
  } else {
    monitorData.proxyUrl = undefined
  }

  const updatedMonitor = updateMonitor(id, monitorData)

  revalidatePath("/")
  revalidatePath(`/monitors/${id}`)
  return updatedMonitor
}

// Acción para pausar/reanudar un monitor
export async function toggleMonitorPause(id: string, paused: boolean) {
  const updatedMonitor = updateMonitor(id, { paused })
  revalidatePath("/")
  revalidatePath(`/monitors/${id}`)
  return updatedMonitor
}

// Acción para eliminar un monitor
export async function removeMonitor(id: string) {
  const result = deleteMonitor(id)
  revalidatePath("/")
  return result
}

// Acción para obtener todos los monitores
export async function fetchMonitors() {
  return getMonitors()
}

// Acción para obtener un monitor por ID
export async function fetchMonitor(id: string) {
  return getMonitorById(id)
}

// Acción para obtener logs de un monitor por rango de tiempo
export async function fetchMonitorLogs(id: string, timeRange: "recent" | "3h" | "9h" | "1d") {
  return getMonitorLogsByTimeRange(id, timeRange)
}

// Acción para obtener el uptime de un monitor
export async function fetchMonitorUptime(id: string) {
  return calculateUptime(id)
}

// Realizar una comprobación según el tipo de monitor
export async function checkMonitor(monitorId: string) {
  const monitor = getMonitorById(monitorId)

  if (!monitor || monitor.paused) {
    return null
  }

  // Realizar la comprobación según el tipo de monitor
  const checkResult = await checkMonitorByType(monitor)

  // Registrar el resultado
  const log = addLog(checkResult)

  revalidatePath("/")
  revalidatePath(`/monitors/${monitorId}`)

  return log
}

// Acciones para la configuración de Telegram
export async function fetchTelegramConfig() {
  return getTelegramConfig()
}

export async function saveTelegramConfig(botToken: string, chatId: string, enabled: boolean) {
  const result = updateTelegramConfig(botToken, chatId, enabled)
  revalidatePath("/settings")
  return result
}

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
} from "@/lib/data"

// Acción para crear un nuevo monitor
export async function createMonitor(formData: FormData) {
  const name = formData.get("name") as string
  const url = formData.get("url") as string
  const interval = Number.parseInt(formData.get("interval") as string)

  if (!name || !url || !interval) {
    throw new Error("Todos los campos son obligatorios")
  }

  const newMonitor = addMonitor({
    name,
    url,
    interval,
    paused: false,
  })

  revalidatePath("/")
  return newMonitor
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

// Simular una comprobación HTTP (en un entorno real, haríamos una petición real)
export async function simulateCheck(monitorId: string) {
  const monitor = getMonitorById(monitorId)

  if (!monitor || monitor.paused) {
    return null
  }

  // Simulamos una respuesta (en un entorno real, haríamos fetch a la URL)
  const isUp = Math.random() > 0.1 // 90% de probabilidad de estar activo
  const responseTime = isUp ? Math.floor(Math.random() * 300) + 50 : 0

  const log = addLog({
    monitorId,
    status: isUp ? "up" : "down",
    responseTime,
  })

  revalidatePath("/")
  revalidatePath(`/monitors/${monitorId}`)

  return log
}

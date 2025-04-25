import type { Monitor, LogEntry, CertificateInfo } from "@/lib/types"

export async function checkWebsite(monitor: Monitor): Promise<Omit<LogEntry, "id" | "timestamp">> {
  const startTime = performance.now()
  let status: "up" | "down" = "down"
  let responseTime = 0
  let statusCode: number | undefined
  let error: string | undefined
  let certificateInfo: CertificateInfo | undefined

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

    const requestOptions: RequestInit = {
      method: monitor.method,
      headers: monitor.headers,
      signal: controller.signal,
    }

    // Añadir body si es necesario y el método lo permite
    if (monitor.body && ["POST", "PUT", "PATCH"].includes(monitor.method || "")) {
      requestOptions.body = monitor.body
    }

    // Configurar proxy si está habilitado
    if (monitor.useProxy && monitor.proxyUrl) {
      // En un entorno real, aquí se configuraría el proxy
      // Para esta implementación, solo lo simulamos
    }

    const response = await fetch(monitor.url, requestOptions)
    clearTimeout(timeoutId)

    // Calcular tiempo de respuesta
    responseTime = Math.round(performance.now() - startTime)
    statusCode = response.status

    // Verificar certificado SSL si está habilitado
    if (monitor.checkCertificate && monitor.url.startsWith("https://")) {
      try {
        // En un entorno real, aquí se verificaría el certificado SSL
        // Para esta implementación, simulamos la información del certificado
        const expiryDays = Math.floor(Math.random() * 100) + 1 // Entre 1 y 100 días
        certificateInfo = {
          issuer: "Let's Encrypt Authority X3",
          subject: new URL(monitor.url).hostname,
          validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días atrás
          validTo: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: expiryDays,
        }
      } catch (certError) {
        error = `Error al verificar el certificado SSL: ${certError instanceof Error ? certError.message : "Error desconocido"}`
      }
    }

    // Verificar si el código de estado coincide con el esperado
    if (response.status === (monitor.expectedStatus || 200)) {
      status = "up"
    } else {
      status = "down"
      error = `Código de estado ${response.status} no coincide con el esperado (${monitor.expectedStatus || 200})`
    }
  } catch (err) {
    // Calcular tiempo de respuesta incluso en caso de error
    responseTime = Math.round(performance.now() - startTime)

    // Manejar errores de red o timeout
    if (err instanceof Error) {
      error = err.message
      if (err.name === "AbortError") {
        error = "La solicitud excedió el tiempo de espera (10s)"
      }
    } else {
      error = "Error desconocido"
    }
  }

  return {
    monitorId: monitor.id,
    status,
    responseTime,
    statusCode,
    error,
    certificateInfo,
  }
}

export async function checkPing(monitor: Monitor): Promise<Omit<LogEntry, "id" | "timestamp">> {
  // En un entorno real, aquí se realizaría un ping real
  // Para esta implementación, simulamos la respuesta

  const startTime = performance.now()
  const packetCount = Number.parseInt(monitor.packetCount || "4")

  // Simulamos un tiempo de respuesta entre 5ms y 200ms
  const min = Math.floor(Math.random() * 50) + 5
  const max = min + Math.floor(Math.random() * 150)
  const avg = Math.floor((min + max) / 2)

  // Simulamos una pérdida de paquetes entre 0% y 10%
  const packetLoss = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 10)

  // Si la pérdida de paquetes es mayor al 50%, consideramos que está caído
  const status = packetLoss < 50 ? "up" : "down"

  // Tiempo de respuesta simulado
  const responseTime = avg

  // Simulamos un pequeño retraso para que parezca que está haciendo algo
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    monitorId: monitor.id,
    status,
    responseTime,
    pingInfo: {
      min,
      max,
      avg,
      packetLoss,
    },
    error: status === "down" ? `Pérdida de paquetes del ${packetLoss}%` : undefined,
  }
}

export async function checkDNS(monitor: Monitor): Promise<Omit<LogEntry, "id" | "timestamp">> {
  // En un entorno real, aquí se realizaría una consulta DNS real
  // Para esta implementación, simulamos la respuesta

  const startTime = performance.now()

  // Simulamos un tiempo de respuesta entre 10ms y 100ms
  const responseTime = Math.floor(Math.random() * 90) + 10

  // Simulamos registros DNS (con 20% de probabilidad de que no existan registros)
  const recordsExist = Math.random() > 0.2
  const records = recordsExist ? ["192.168.1.1", "192.168.1.2"] : []

  // Si no hay registros o si hay un resultado esperado que no coincide, marcamos como caído
  let status = "up"
  let error: string | undefined

  if (!recordsExist) {
    status = "down"
    error = "No se encontraron registros DNS"
  } else if (monitor.dnsExpectedResult && !records.includes(monitor.dnsExpectedResult)) {
    status = "down"
    error = `No se encontró el registro esperado: ${monitor.dnsExpectedResult}`
  }

  // Simulamos un pequeño retraso para que parezca que está haciendo algo
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    monitorId: monitor.id,
    status,
    responseTime,
    dnsInfo: {
      records,
      server: monitor.dnsServer || "8.8.8.8",
    },
    error,
  }
}

export async function checkTCP(monitor: Monitor): Promise<Omit<LogEntry, "id" | "timestamp">> {
  // En un entorno real, aquí se realizaría una conexión TCP real
  // Para esta implementación, simulamos la respuesta

  const startTime = performance.now()

  // Simulamos un tiempo de respuesta entre 5ms y 150ms
  const responseTime = Math.floor(Math.random() * 145) + 5

  // Simulamos éxito o fallo (90% de éxito)
  const status = Math.random() < 0.9 ? "up" : "down"

  // Simulamos un pequeño retraso para que parezca que está haciendo algo
  await new Promise((resolve) => setTimeout(resolve, 200))

  return {
    monitorId: monitor.id,
    status,
    responseTime,
    error: status === "down" ? `No se pudo conectar al puerto ${monitor.port}` : undefined,
  }
}

export async function checkMonitorByType(monitor: Monitor): Promise<Omit<LogEntry, "id" | "timestamp">> {
  switch (monitor.type) {
    case "http":
      return checkWebsite(monitor)
    case "ping":
      return checkPing(monitor)
    case "dns":
      return checkDNS(monitor)
    case "tcp":
      return checkTCP(monitor)
    default:
      // Para otros tipos, usamos HTTP por defecto
      return checkWebsite(monitor)
  }
}

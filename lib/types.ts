export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "PATCH"

export type MonitorType = "http" | "tcp" | "ping" | "dns"

export interface Monitor {
  id: string
  name: string
  type: MonitorType
  url: string
  interval: number
  status: "up" | "down" | "unknown"
  paused: boolean
  createdAt: string
  lastChecked?: string
  responseTime?: number
  lastError?: string
  tags?: string[]

  // HTTP/HTTPS específico
  method?: HttpMethod
  expectedStatus?: number
  headers?: Record<string, string>
  body?: string

  // DNS específico
  dnsServer?: string
  dnsRecordType?: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS"
  dnsExpectedResult?: string

  // TCP específico
  port?: number

  // Ping específico
  packetCount?: number

  // Certificado SSL
  checkCertificate?: boolean
  certificateExpiry?: number

  // Proxy
  useProxy?: boolean
  proxyUrl?: string
}

export interface LogEntry {
  id: string
  monitorId: string
  timestamp: string
  status: "up" | "down"
  responseTime: number
  statusCode?: number
  error?: string
  certificateInfo?: CertificateInfo
  pingInfo?: PingInfo
  dnsInfo?: DNSInfo
}

export interface CertificateInfo {
  issuer: string
  subject: string
  validFrom: string
  validTo: string
  daysRemaining: number
}

export interface PingInfo {
  min: number
  max: number
  avg: number
  packetLoss: number
}

export interface DNSInfo {
  records: string[]
  server: string
}

export interface StatusPage {
  id: string
  name: string
  slug: string
  domain?: string
  monitors: string[] // IDs de monitores
  public: boolean
  theme: "light" | "dark" | "auto"
  logo?: string
  description?: string
}

export interface UserSettings {
  id: string
  theme: "light" | "dark" | "system"
}

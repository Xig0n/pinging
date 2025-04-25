import { Globe, Link2, Activity, Database } from "lucide-react"
import type { MonitorType } from "@/lib/types"

interface MonitorTypeIconProps {
  type: MonitorType
  className?: string
}

export function MonitorTypeIcon({ type, className = "h-4 w-4" }: MonitorTypeIconProps) {
  switch (type) {
    case "http":
      return <Globe className={className} />
    case "tcp":
      return <Link2 className={className} />
    case "ping":
      return <Activity className={className} />
    case "dns":
      return <Database className={className} />
    default:
      return <Globe className={className} />
  }
}

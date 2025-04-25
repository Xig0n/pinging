"use client"

import Link from "next/link"
import { ArrowUpRight, Clock, Pause, Play, Shield, AlertTriangle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toggleMonitorPause, checkMonitor } from "@/app/api/actions"
import { MonitorTypeIcon } from "@/components/monitor-type-icon"
import type { MonitorType } from "@/lib/types"

interface MonitorCardProps {
  id: string
  name: string
  url: string
  type: MonitorType
  status: "up" | "down" | "unknown"
  responseTime: number
  uptime: number
  paused: boolean
  certificateExpiry?: number
  tags?: string[]
}

export function MonitorCard({
  id,
  name,
  url,
  type,
  status,
  responseTime,
  uptime,
  paused: initialPaused,
  certificateExpiry,
  tags,
}: MonitorCardProps) {
  const [paused, setPaused] = useState(initialPaused)
  const [isLoading, setIsLoading] = useState(false)

  const togglePause = async () => {
    setIsLoading(true)
    try {
      await toggleMonitorPause(id, !paused)
      setPaused(!paused)
    } catch (error) {
      console.error("Error al cambiar el estado del monitor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheck = async () => {
    setIsLoading(true)
    try {
      await checkMonitor(id)
    } catch (error) {
      console.error("Error al comprobar el monitor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`${paused ? "opacity-75" : ""} transition-all hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={status === "up" ? "success" : status === "down" ? "destructive" : "outline"}
              className="px-3 py-1 text-base font-medium"
            >
              {status === "up" ? "Activo" : status === "down" ? "Caído" : "Desconocido"}
            </Badge>
            <Badge variant="outline" className="px-2 py-0 h-5 flex items-center gap-1">
              <MonitorTypeIcon type={type} className="h-3 w-3" />
              <span>{type.toUpperCase()}</span>
            </Badge>
          </div>
          {paused && (
            <Badge variant="outline" className="px-2 py-0 h-5">
              Pausado
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" />
          <span className="truncate">{url}</span>
        </CardDescription>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tiempo de respuesta</p>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{status === "up" ? `${responseTime} ms` : "N/A"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Disponibilidad</p>
            <p className="font-medium">{uptime}%</p>
          </div>
        </div>

        {certificateExpiry !== undefined && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            {certificateExpiry > 30 ? (
              <Shield className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span>
              {certificateExpiry > 30
                ? `Certificado SSL válido (${certificateExpiry} días)`
                : `Certificado SSL expira pronto (${certificateExpiry} días)`}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={togglePause} className="gap-1" disabled={isLoading}>
            {paused ? (
              <>
                <Play className="h-3 w-3" /> Reanudar
              </>
            ) : (
              <>
                <Pause className="h-3 w-3" /> Pausar
              </>
            )}
          </Button>
          {!paused && (
            <Button variant="ghost" size="sm" onClick={handleCheck} disabled={isLoading}>
              Comprobar
            </Button>
          )}
        </div>
        <Link href={`/monitors/${id}`}>
          <Button size="sm">Ver detalles</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

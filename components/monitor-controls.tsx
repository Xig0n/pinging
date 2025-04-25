"use client"

import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleMonitorPause, checkMonitor } from "@/app/api/actions"
import type { Monitor } from "@/lib/types"

interface MonitorControlsProps {
  monitor: Monitor
}

export function MonitorControls({ monitor }: MonitorControlsProps) {
  const [paused, setPaused] = useState(monitor.paused)
  const [isLoading, setIsLoading] = useState(false)

  const togglePause = async () => {
    setIsLoading(true)
    try {
      await toggleMonitorPause(monitor.id, !paused)
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
      await checkMonitor(monitor.id)
    } catch (error) {
      console.error("Error al comprobar el monitor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={paused ? "default" : "outline"} onClick={togglePause} className="gap-2" disabled={isLoading}>
        {paused ? (
          <>
            <Play className="h-4 w-4" /> Reanudar
          </>
        ) : (
          <>
            <Pause className="h-4 w-4" /> Pausar
          </>
        )}
      </Button>
      {!paused && (
        <Button variant="outline" onClick={handleCheck} disabled={isLoading}>
          Comprobar ahora
        </Button>
      )}
    </div>
  )
}

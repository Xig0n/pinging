"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { fetchMonitors } from "@/app/api/actions"
import type { Monitor } from "@/lib/types"

export function SearchMonitors() {
  const [open, setOpen] = useState(false)
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (open) {
      loadMonitors()
    }
  }, [open])

  const loadMonitors = async () => {
    try {
      const data = await fetchMonitors()
      setMonitors(data)
    } catch (error) {
      console.error("Error al cargar monitores:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up":
        return <Badge variant="success">Activo</Badge>
      case "down":
        return <Badge variant="destructive">Caído</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      http: "HTTP",
      tcp: "TCP",
      keyword: "Keyword",
      json: "JSON",
      ping: "Ping",
      dns: "DNS",
      push: "Push",
      steam: "Steam",
      docker: "Docker",
    }
    return types[type] || type.toUpperCase()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline-flex">Buscar monitores...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar monitores..." />
        <CommandList>
          <CommandEmpty>No se encontraron monitores.</CommandEmpty>
          <CommandGroup heading="Monitores">
            {monitors.map((monitor) => (
              <CommandItem
                key={monitor.id}
                onSelect={() => {
                  router.push(`/monitors/${monitor.id}`)
                  setOpen(false)
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{monitor.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {getTypeLabel(monitor.type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(monitor.status)}
                  {monitor.paused && <Badge variant="outline">Pausado</Badge>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

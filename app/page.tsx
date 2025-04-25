import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MonitorCard } from "@/components/monitor-card"
import { fetchMonitors, fetchMonitorUptime } from "@/app/api/actions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchBar } from "@/components/search-bar"

export default async function Home({ searchParams }: { searchParams: { q?: string; type?: string } }) {
  const monitors = await fetchMonitors()
  const searchQuery = searchParams.q?.toLowerCase() || ""
  const typeFilter = searchParams.type || ""

  // Filtrar monitores por búsqueda y tipo
  const filteredMonitors = monitors.filter((monitor) => {
    const matchesSearch = searchQuery
      ? monitor.name.toLowerCase().includes(searchQuery) || monitor.url.toLowerCase().includes(searchQuery)
      : true

    const matchesType = typeFilter ? monitor.type === typeFilter : true

    return matchesSearch && matchesType
  })

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitores</h1>
          <p className="text-muted-foreground">Gestiona y visualiza el estado de tus sitios web y servicios</p>
        </div>
        <Link href="/monitors/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Monitor
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <SearchBar defaultValue={searchQuery} />

        <Tabs defaultValue={typeFilter || "all"} className="w-full">
          <TabsList className="grid grid-cols-4 md:w-fit">
            <TabsTrigger value="all" asChild>
              <Link href={{ pathname: "/", query: { ...searchParams, type: undefined } }}>Todos</Link>
            </TabsTrigger>
            <TabsTrigger value="http" asChild>
              <Link href={{ pathname: "/", query: { ...searchParams, type: "http" } }}>HTTP</Link>
            </TabsTrigger>
            <TabsTrigger value="ping" asChild>
              <Link href={{ pathname: "/", query: { ...searchParams, type: "ping" } }}>Ping</Link>
            </TabsTrigger>
            <TabsTrigger value="dns" asChild>
              <Link href={{ pathname: "/", query: { ...searchParams, type: "dns" } }}>DNS</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredMonitors.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">
            No hay monitores {searchQuery && "que coincidan con tu búsqueda"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Intenta con otros términos de búsqueda o elimina los filtros"
              : "Añade tu primer monitor para comenzar a monitorizar tus sitios web"}
          </p>
          {!searchQuery && (
            <Link href="/monitors/new">
              <Button>Añadir monitor</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {
            await Promise.all(
              filteredMonitors.map(async (monitor) => {
                const uptime = await fetchMonitorUptime(monitor.id)
                return (
                  <MonitorCard
                    key={monitor.id}
                    id={monitor.id}
                    name={monitor.name}
                    url={monitor.url}
                    type={monitor.type}
                    status={monitor.status}
                    responseTime={monitor.responseTime || 0}
                    uptime={uptime}
                    paused={monitor.paused}
                    certificateExpiry={monitor.certificateExpiry}
                    tags={monitor.tags}
                  />
                )
              }),
            )
          }
        </div>
      )}
    </div>
  )
}

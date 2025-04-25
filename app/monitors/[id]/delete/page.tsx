"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchMonitor, removeMonitor } from "@/app/api/actions"

export default function DeleteMonitor({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [monitor, setMonitor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useState(() => {
    const loadMonitor = async () => {
      try {
        const data = await fetchMonitor(params.id)
        if (!data) {
          notFound()
        }
        setMonitor(data)
      } catch (error) {
        console.error("Error al cargar el monitor:", error)
        setError("Error al cargar los datos del monitor")
      } finally {
        setIsLoading(false)
      }
    }

    loadMonitor()
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await removeMonitor(params.id)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el monitor")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p>Cargando datos del monitor...</p>
        </div>
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className="container py-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p>No se encontró el monitor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/monitors/${params.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Eliminar Monitor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirmar eliminación</CardTitle>
          <CardDescription>Esta acción no se puede deshacer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Estás a punto de eliminar el monitor <strong>{monitor.name}</strong>. Todos los datos asociados, incluidos
              los registros históricos, se eliminarán permanentemente.
            </AlertDescription>
          </Alert>

          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}

          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Detalles del monitor:</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">Nombre:</span> {monitor.name}
              </li>
              <li>
                <span className="font-medium">URL:</span> {monitor.url}
              </li>
              <li>
                <span className="font-medium">Tipo:</span> {monitor.type.toUpperCase()}
              </li>
              <li>
                <span className="font-medium">Estado actual:</span>{" "}
                <span
                  className={
                    monitor.status === "up"
                      ? "text-emerald-500"
                      : monitor.status === "down"
                        ? "text-red-500"
                        : "text-gray-500"
                  }
                >
                  {monitor.status === "up" ? "Activo" : monitor.status === "down" ? "Caído" : "Desconocido"}
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/monitors/${params.id}`}>
            <Button variant="outline" type="button" disabled={isDeleting}>
              Cancelar
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar Monitor"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

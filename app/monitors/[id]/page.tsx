import Link from "next/link"
import { ArrowLeft, Clock, ExternalLink, AlertCircle, Shield, Activity, Edit, Trash2 } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MonitorDetailChart } from "@/components/monitor-detail-chart"
import { MonitorControls } from "@/components/monitor-controls"
import { fetchMonitor, fetchMonitorUptime } from "@/app/api/actions"
import { MonitorTypeIcon } from "@/components/monitor-type-icon"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function MonitorDetail({ params }: { params: { id: string } }) {
  const monitor = await fetchMonitor(params.id)

  if (!monitor) {
    notFound()
  }

  const uptime = await fetchMonitorUptime(monitor.id)

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{monitor.name}</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <MonitorTypeIcon type={monitor.type} className="h-3 w-3" />
              <span>{monitor.type.toUpperCase()}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              {monitor.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={monitor.status === "up" ? "success" : monitor.status === "down" ? "destructive" : "outline"}
            className="px-4 py-1.5 text-lg font-medium"
          >
            {monitor.status === "up" ? "Activo" : monitor.status === "down" ? "Caído" : "Desconocido"}
          </Badge>
          <Link href={`/monitors/${monitor.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </Link>
          <Link href={`/monitors/${monitor.id}/delete`}>
            <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </Link>
          <MonitorControls monitor={monitor} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {monitor.status === "up" ? `${monitor.responseTime || 0} ms` : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{uptime}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Intervalo de comprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitor.interval < 1
                ? `Cada ${Math.round(monitor.interval * 60)} segundos`
                : `Cada ${monitor.interval} ${monitor.interval === 1 ? "minuto" : "minutos"}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {monitor.certificateExpiry !== undefined && (
        <Card className={monitor.certificateExpiry > 30 ? "border-emerald-200" : "border-amber-200"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {monitor.certificateExpiry > 30 ? (
                <Shield className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              Certificado SSL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">
              {monitor.certificateExpiry > 30
                ? `Válido por ${monitor.certificateExpiry} días más`
                : `¡Expira en ${monitor.certificateExpiry} días!`}
            </div>
          </CardContent>
        </Card>
      )}

      {monitor.lastError && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Último error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-muted p-3 rounded-md overflow-x-auto">{monitor.lastError}</div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="response-time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="response-time">Tiempo de respuesta</TabsTrigger>
          <TabsTrigger value="uptime">Disponibilidad</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time">
          <Card>
            <CardHeader>
              <CardTitle>Tiempo de respuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <MonitorDetailChart monitorId={monitor.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uptime">
          <Card>
            <CardHeader>
              <CardTitle>Disponibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de disponibilidad en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Tipo</dt>
                  <dd className="flex items-center gap-1">
                    <MonitorTypeIcon type={monitor.type} className="h-4 w-4" />
                    {monitor.type.toUpperCase()}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-muted-foreground">Intervalo</dt>
                  <dd>
                    {monitor.interval < 1
                      ? `Cada ${Math.round(monitor.interval * 60)} segundos`
                      : `Cada ${monitor.interval} ${monitor.interval === 1 ? "minuto" : "minutos"}`}
                  </dd>
                </div>

                {monitor.method && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Método HTTP</dt>
                    <dd>{monitor.method}</dd>
                  </div>
                )}

                {monitor.expectedStatus && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Código esperado</dt>
                    <dd>{monitor.expectedStatus}</dd>
                  </div>
                )}

                {monitor.port && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Puerto</dt>
                    <dd>{monitor.port}</dd>
                  </div>
                )}

                {monitor.jsonPath && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">JSON Path</dt>
                    <dd className="font-mono text-xs bg-muted p-2 rounded-md mt-1">
                      {monitor.jsonPath} = {monitor.jsonValue}
                    </dd>
                  </div>
                )}

                {monitor.dnsRecordType && (
                  <>
                    <div>
                      <dt className="font-medium text-muted-foreground">Tipo de registro DNS</dt>
                      <dd>{monitor.dnsRecordType}</dd>
                    </div>
                    {monitor.dnsServer && (
                      <div>
                        <dt className="font-medium text-muted-foreground">Servidor DNS</dt>
                        <dd>{monitor.dnsServer}</dd>
                      </div>
                    )}
                  </>
                )}

                {monitor.headers && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Headers</dt>
                    <dd className="font-mono text-xs bg-muted p-2 rounded-md mt-1 overflow-x-auto">
                      {JSON.stringify(monitor.headers, null, 2)}
                    </dd>
                  </div>
                )}

                {monitor.body && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Body</dt>
                    <dd className="font-mono text-xs bg-muted p-2 rounded-md mt-1 overflow-x-auto">{monitor.body}</dd>
                  </div>
                )}

                {monitor.useProxy && monitor.proxyUrl && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Proxy</dt>
                    <dd>{monitor.proxyUrl}</dd>
                  </div>
                )}

                {monitor.tags && monitor.tags.length > 0 && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Etiquetas</dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {monitor.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

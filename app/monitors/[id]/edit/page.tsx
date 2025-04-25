"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { fetchMonitor, updateExistingMonitor } from "@/app/api/actions"
import { MonitorTypeIcon } from "@/components/monitor-type-icon"
import type { HttpMethod, MonitorType, Monitor } from "@/lib/types"

export default function EditMonitor({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [monitorType, setMonitorType] = useState<MonitorType>("http")
  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    interval: "5",
    type: "http" as MonitorType,
    tags: "",

    // HTTP específico
    method: "GET" as HttpMethod,
    expectedStatus: "200",
    headers: "",
    body: "",

    // DNS específico
    dnsServer: "",
    dnsRecordType: "A",
    dnsExpectedResult: "",

    // TCP específico
    port: "80",

    // Ping específico
    packetCount: "4",

    // Certificado SSL
    checkCertificate: true,

    // Proxy
    useProxy: false,
    proxyUrl: "",
  })

  useEffect(() => {
    const loadMonitor = async () => {
      try {
        const data = await fetchMonitor(params.id)
        if (!data) {
          notFound()
        }
        setMonitor(data)
        setMonitorType(data.type)

        // Convertir las etiquetas de array a string separado por comas
        const tagsString = data.tags ? data.tags.join(", ") : ""

        // Convertir headers a string si existen
        const headersString = data.headers ? JSON.stringify(data.headers, null, 2) : ""

        setFormData({
          name: data.name,
          url: data.url,
          interval: data.interval.toString(),
          type: data.type,
          tags: tagsString,

          // HTTP específico
          method: data.method || "GET",
          expectedStatus: data.expectedStatus?.toString() || "200",
          headers: headersString,
          body: data.body || "",

          // DNS específico
          dnsServer: data.dnsServer || "",
          dnsRecordType: data.dnsRecordType || "A",
          dnsExpectedResult: data.dnsExpectedResult || "",

          // TCP específico
          port: data.port?.toString() || "80",

          // Ping específico
          packetCount: data.packetCount || "4",

          // Certificado SSL
          checkCertificate: data.checkCertificate !== false,

          // Proxy
          useProxy: !!data.useProxy,
          proxyUrl: data.proxyUrl || "",
        })
      } catch (error) {
        console.error("Error al cargar el monitor:", error)
        setError("Error al cargar los datos del monitor")
      } finally {
        setIsLoading(false)
      }
    }

    loadMonitor()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleTypeChange = (type: MonitorType) => {
    setFormData((prev) => ({ ...prev, type }))
    setMonitorType(type)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formDataObj = new FormData()

      // Datos básicos
      formDataObj.append("name", formData.name)
      formDataObj.append("url", formData.url)
      formDataObj.append("interval", formData.interval)
      formDataObj.append("type", formData.type)
      formDataObj.append("tags", formData.tags)

      // Datos específicos según el tipo
      switch (formData.type) {
        case "http":
          formDataObj.append("method", formData.method)
          formDataObj.append("expectedStatus", formData.expectedStatus)
          formDataObj.append("headers", formData.headers)
          formDataObj.append("body", formData.body)
          formDataObj.append("checkCertificate", String(formData.checkCertificate))
          break

        case "tcp":
          formDataObj.append("port", formData.port)
          break

        case "ping":
          formDataObj.append("packetCount", formData.packetCount)
          break

        case "dns":
          formDataObj.append("dnsServer", formData.dnsServer)
          formDataObj.append("dnsRecordType", formData.dnsRecordType)
          formDataObj.append("dnsExpectedResult", formData.dnsExpectedResult)
          break
      }

      // Proxy
      formDataObj.append("useProxy", String(formData.useProxy))
      if (formData.useProxy) {
        formDataObj.append("proxyUrl", formData.proxyUrl)
      }

      await updateExistingMonitor(params.id, formDataObj)
      router.push(`/monitors/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el monitor")
    } finally {
      setIsSubmitting(false)
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
        <h1 className="text-3xl font-bold tracking-tight">Editar Monitor</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del monitor</CardTitle>
            <CardDescription>Modifica los detalles del monitor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}

            <div className="space-y-2">
              <Label>Tipo de monitor</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["http", "tcp", "ping", "dns"].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={monitorType === type ? "default" : "outline"}
                    className="flex flex-col items-center justify-center h-20 gap-2"
                    onClick={() => handleTypeChange(type as MonitorType)}
                  >
                    <MonitorTypeIcon type={type as MonitorType} className="h-5 w-5" />
                    <span className="text-xs">{type.toUpperCase()}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="advanced">Avanzado</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Mi Sitio Web"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">
                    {monitorType === "http"
                      ? "URL"
                      : monitorType === "tcp"
                        ? "Host"
                        : monitorType === "ping"
                          ? "Dirección IP o Hostname"
                          : monitorType === "dns"
                            ? "Dominio"
                            : "URL/Dirección"}
                  </Label>
                  <Input
                    id="url"
                    name="url"
                    placeholder={
                      monitorType === "http"
                        ? "https://ejemplo.com"
                        : monitorType === "tcp"
                          ? "ejemplo.com"
                          : monitorType === "ping"
                            ? "8.8.8.8"
                            : monitorType === "dns"
                              ? "ejemplo.com"
                              : "https://ejemplo.com"
                    }
                    value={formData.url}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo de comprobación</Label>
                  <Select value={formData.interval} onValueChange={(value) => handleSelectChange("interval", value)}>
                    <SelectTrigger id="interval">
                      <SelectValue placeholder="Selecciona un intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.33">Cada 20 segundos</SelectItem>
                      <SelectItem value="0.5">Cada 30 segundos</SelectItem>
                      <SelectItem value="1">Cada 1 minuto</SelectItem>
                      <SelectItem value="5">Cada 5 minutos</SelectItem>
                      <SelectItem value="10">Cada 10 minutos</SelectItem>
                      <SelectItem value="15">Cada 15 minutos</SelectItem>
                      <SelectItem value="30">Cada 30 minutos</SelectItem>
                      <SelectItem value="60">Cada hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="producción, web, crítico"
                    value={formData.tags}
                    onChange={handleChange}
                  />
                </div>

                {/* Campos específicos según el tipo de monitor */}
                {monitorType === "http" && (
                  <div className="space-y-2">
                    <Label htmlFor="method">Método HTTP</Label>
                    <Select value={formData.method} onValueChange={(value) => handleSelectChange("method", value)}>
                      <SelectTrigger id="method">
                        <SelectValue placeholder="Selecciona un método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="HEAD">HEAD</SelectItem>
                        <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {monitorType === "tcp" && (
                  <div className="space-y-2">
                    <Label htmlFor="port">Puerto</Label>
                    <Input
                      id="port"
                      name="port"
                      type="number"
                      placeholder="80"
                      value={formData.port}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                {monitorType === "ping" && (
                  <div className="space-y-2">
                    <Label htmlFor="packetCount">Número de paquetes</Label>
                    <Input
                      id="packetCount"
                      name="packetCount"
                      type="number"
                      placeholder="4"
                      value={formData.packetCount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                {monitorType === "dns" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dnsServer">Servidor DNS (opcional)</Label>
                      <Input
                        id="dnsServer"
                        name="dnsServer"
                        placeholder="8.8.8.8"
                        value={formData.dnsServer}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dnsRecordType">Tipo de registro</Label>
                      <Select
                        value={formData.dnsRecordType}
                        onValueChange={(value) => handleSelectChange("dnsRecordType", value)}
                      >
                        <SelectTrigger id="dnsRecordType">
                          <SelectValue placeholder="Tipo de registro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="AAAA">AAAA</SelectItem>
                          <SelectItem value="CNAME">CNAME</SelectItem>
                          <SelectItem value="MX">MX</SelectItem>
                          <SelectItem value="TXT">TXT</SelectItem>
                          <SelectItem value="NS">NS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dnsExpectedResult">Resultado esperado (opcional)</Label>
                      <Input
                        id="dnsExpectedResult"
                        name="dnsExpectedResult"
                        placeholder="192.168.1.1"
                        value={formData.dnsExpectedResult}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-6">
                {monitorType === "http" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="expectedStatus">Código de respuesta esperado</Label>
                      <Select
                        value={formData.expectedStatus}
                        onValueChange={(value) => handleSelectChange("expectedStatus", value)}
                      >
                        <SelectTrigger id="expectedStatus">
                          <SelectValue placeholder="Selecciona un código" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="200">200 - OK</SelectItem>
                          <SelectItem value="201">201 - Created</SelectItem>
                          <SelectItem value="204">204 - No Content</SelectItem>
                          <SelectItem value="301">301 - Moved Permanently</SelectItem>
                          <SelectItem value="302">302 - Found</SelectItem>
                          <SelectItem value="304">304 - Not Modified</SelectItem>
                          <SelectItem value="400">400 - Bad Request</SelectItem>
                          <SelectItem value="401">401 - Unauthorized</SelectItem>
                          <SelectItem value="403">403 - Forbidden</SelectItem>
                          <SelectItem value="404">404 - Not Found</SelectItem>
                          <SelectItem value="500">500 - Internal Server Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headers">Headers (opcional)</Label>
                      <Textarea
                        id="headers"
                        name="headers"
                        placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                        value={formData.headers}
                        onChange={handleChange}
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-muted-foreground">Formato JSON de los headers a enviar</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="body">Body (opcional)</Label>
                      <Textarea
                        id="body"
                        name="body"
                        placeholder='{"key": "value"}'
                        value={formData.body}
                        onChange={handleChange}
                        className="font-mono text-sm"
                      />
                      <p className="text-sm text-muted-foreground">
                        Cuerpo de la petición para métodos POST, PUT, PATCH
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="checkCertificate"
                        checked={formData.checkCertificate}
                        onCheckedChange={(checked) => handleSwitchChange("checkCertificate", checked)}
                      />
                      <Label htmlFor="checkCertificate">Verificar certificado SSL</Label>
                    </div>
                  </>
                )}

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useProxy"
                      checked={formData.useProxy}
                      onCheckedChange={(checked) => handleSwitchChange("useProxy", checked)}
                    />
                    <Label htmlFor="useProxy">Usar proxy</Label>
                  </div>

                  {formData.useProxy && (
                    <div className="space-y-2">
                      <Label htmlFor="proxyUrl">URL del proxy</Label>
                      <Input
                        id="proxyUrl"
                        name="proxyUrl"
                        placeholder="http://usuario:contraseña@proxy.ejemplo.com:8080"
                        value={formData.proxyUrl}
                        onChange={handleChange}
                        required={formData.useProxy}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/monitors/${params.id}`}>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

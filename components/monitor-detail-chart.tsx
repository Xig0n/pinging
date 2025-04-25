"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchMonitorLogs } from "@/app/api/actions"
import type { LogEntry } from "@/lib/types"

interface MonitorDetailChartProps {
  monitorId: string
}

export function MonitorDetailChart({ monitorId }: MonitorDetailChartProps) {
  const [timeRange, setTimeRange] = useState<"recent" | "3h" | "9h" | "1d">("recent")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const data = await fetchMonitorLogs(monitorId, timeRange)
        setLogs(data)
      } catch (error) {
        console.error("Error al cargar los logs:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [monitorId, timeRange])

  const formatData = (logs: LogEntry[]) => {
    return logs.map((log) => ({
      time: new Date(log.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        ...(timeRange === "1d" ? { hour12: false } : {}),
      }),
      responseTime: log.status === "up" ? log.responseTime : 0,
      status: log.status,
      statusCode: log.statusCode,
    }))
  }

  const chartData = formatData(logs)

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="recent"
        value={timeRange}
        onValueChange={(value) => setTimeRange(value as any)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="recent">Reciente</TabsTrigger>
          <TabsTrigger value="3h">3h</TabsTrigger>
          <TabsTrigger value="9h">9h</TabsTrigger>
          <TabsTrigger value="1d">1d</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange}>
          {loading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <p>Cargando datos...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <p>No hay datos disponibles para este período</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    domain={[0, "dataMax + 50"]}
                    label={{
                      value: "ms",
                      position: "insideLeft",
                      angle: -90,
                      style: { textAnchor: "middle" },
                      dy: 50,
                    }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name === "responseTime") {
                        return [`${value} ms`, "Tiempo de respuesta"]
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Hora: ${label}`}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-md p-2 shadow-sm">
                            <p className="font-medium">{`Hora: ${label}`}</p>
                            <p className="text-sm">{`Tiempo: ${data.responseTime} ms`}</p>
                            {data.statusCode && <p className="text-sm">{`Código: ${data.statusCode}`}</p>}
                            <p className="text-sm">
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  data.status === "up" ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              ></span>
                              {data.status === "up" ? "Activo" : "Caído"}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={true}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

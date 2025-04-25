"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ResponseTimeChartProps {
  timeRange: "recent" | "3h" | "9h" | "1d"
}

export function ResponseTimeChart({ timeRange }: ResponseTimeChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // En una aplicación real, aquí se cargarían los datos desde una API
    // según el rango de tiempo seleccionado
    const generateData = () => {
      const now = new Date()
      const points = timeRange === "recent" ? 20 : timeRange === "3h" ? 36 : timeRange === "9h" ? 54 : 72

      const interval =
        timeRange === "recent"
          ? 5 * 60 * 1000
          : timeRange === "3h"
            ? 5 * 60 * 1000
            : timeRange === "9h"
              ? 10 * 60 * 1000
              : 20 * 60 * 1000

      return Array.from({ length: points }).map((_, i) => {
        const time = new Date(now.getTime() - (points - i) * interval)
        return {
          time: time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            ...(timeRange === "1d" ? { hour12: false } : {}),
          }),
          responseTime: Math.floor(Math.random() * 200) + 50,
        }
      })
    }

    setData(generateData())
  }, [timeRange])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            formatter={(value) => [`${value} ms`, "Tiempo de respuesta"]}
            labelFormatter={(label) => `Hora: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

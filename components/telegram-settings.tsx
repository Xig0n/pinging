"use client"

import { useState, useEffect } from "react"
import { Send, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchTelegramConfig, saveTelegramConfig } from "@/app/api/actions"

export function TelegramSettings() {
  const [botToken, setBotToken] = useState("")
  const [chatId, setChatId] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchTelegramConfig()
        setBotToken(config.botToken)
        setChatId(config.chatId)
        setEnabled(config.enabled)
      } catch (error) {
        console.error("Error al cargar la configuración de Telegram:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveTelegramConfig(botToken, chatId, enabled)
      setTestStatus("idle")
    } catch (error) {
      console.error("Error al guardar la configuración de Telegram:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setTestStatus("loading")
    setTestMessage("")

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ Este es un mensaje de prueba de Pinging. Si puedes ver este mensaje, la configuración es correcta.",
          parse_mode: "Markdown",
        }),
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        setTestStatus("success")
        setTestMessage("Mensaje enviado correctamente. Verifica tu chat de Telegram.")
      } else {
        setTestStatus("error")
        setTestMessage(`Error: ${data.description || "No se pudo enviar el mensaje"}`)
      }
    } catch (error) {
      setTestStatus("error")
      setTestMessage(`Error: ${error instanceof Error ? error.message : "No se pudo enviar el mensaje"}`)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones de Telegram</CardTitle>
          <CardDescription>Cargando configuración...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones de Telegram</CardTitle>
        <CardDescription>
          Configura las notificaciones por Telegram para recibir alertas cuando un monitor cambie de estado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch id="telegram-enabled" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="telegram-enabled">Habilitar notificaciones de Telegram</Label>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-token">Token del Bot</Label>
            <Input
              id="bot-token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
              type="password"
            />
            <p className="text-sm text-muted-foreground">
              Crea un bot con{" "}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">
                @BotFather
              </a>{" "}
              y obtén el token
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat-id">ID del Chat</Label>
            <Input
              id="chat-id"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="-1001234567890"
            />
            <p className="text-sm text-muted-foreground">
              Añade el bot a un grupo o inicia un chat con él, luego usa{" "}
              <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">
                @userinfobot
              </a>{" "}
              para obtener tu ID
            </p>
          </div>
        </div>

        {testStatus === "success" && (
          <Alert variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <Check className="h-4 w-4" />
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{testMessage}</AlertDescription>
          </Alert>
        )}

        {testStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{testMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={!botToken || !chatId || testStatus === "loading" || isSaving}
        >
          {testStatus === "loading" ? "Enviando..." : "Probar conexión"}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar configuración"}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

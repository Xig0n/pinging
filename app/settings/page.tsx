import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TelegramSettings } from "@/components/telegram-settings"

export default function SettingsPage() {
  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <TelegramSettings />
      </div>
    </div>
  )
}

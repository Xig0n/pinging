import Link from "next/link"
import { Activity, Settings } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { SearchMonitors } from "@/components/search-monitors"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Pinging</span>
        </Link>

        <div className="flex items-center gap-4">
          <SearchMonitors />
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Configuración</span>
            </Button>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

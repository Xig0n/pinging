"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  defaultValue?: string
}

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams],
  )

  return (
    <div className="relative w-full md:w-72">
      <Input
        placeholder="Buscar monitores..."
        className="pl-8"
        defaultValue={defaultValue}
        onChange={(e) => {
          const query = createQueryString("q", e.target.value)
          router.push(`/?${query}`)
        }}
      />
      <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    </div>
  )
}
